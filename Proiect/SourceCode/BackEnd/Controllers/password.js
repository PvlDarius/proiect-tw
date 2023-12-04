const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const generateToken = () => {
  return uuidv4();
};

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  secureConnection: false,
  port: 587,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [result] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!result.length) {
      return res.render("forgot-password", {
        message: "No user found with that email address",
      });
    }

    const resetToken = generateToken();

    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);

    await pool.execute(
      "UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?",
      [resetToken, expirationTime, email]
    );

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: "Password Reset",
      text: `Click the following link to reset your password: http://localhost:8080/auth/reset-password?token=${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to send email" });
      }

      console.log("Email sent: " + info.response);
      res.render("forgot-password", {
        message: "Password reset email sent. Check your inbox.",
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.body.token; // Extract token from the request body
    console.log("Attempting to reset password for token:", token);

    if (!token) {
      return res.render("reset-password", {
        message: "Invalid or expired reset token",
      });
    }

    const [result] = await pool.execute(
      "SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()",
      [token]
    );

    if (!result.length) {
      return res.render("reset-password", {
        message: "Invalid or expired reset token",
      });
    }

    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 8);

    await pool.execute(
      "UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = ?",
      [hashedPassword, token]
    );

    return res.render("reset-password", {
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
