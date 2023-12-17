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
      return res.redirect(
        "/auth/forgot-password?errorMessage=No user found with this email"
      );
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
        return res.redirect(
          "/auth/forgot-password?errorMessage=Failed to send email"
        );
      }

      return res.redirect(
        "/auth/forgot-password?successMessage=Email sent! Check your inbox"
      );
    });
  } catch (error) {
    console.error(error);
    return res.redirect(
      "/auth/forgot-password?errorMessage=Internal server error"
    );
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.redirect(
        `/auth/reset-password?errorMessage=Invalid or expired reset token.&token=${token}`
      );
    }

    const [result] = await pool.execute(
      "SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()",
      [token]
    );

    if (!result.length) {
      return res.redirect(
        `/auth/reset-password?errorMessage=Invalid or expired reset token.&token=${token}`
      );
    }

    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
      return res.redirect(
        `/auth/reset-password?errorMessage=Passwords do not match.&token=${token}`
      );
    }

    // Update password only if the token is valid
    const hashedPassword = await bcrypt.hash(password, 8);

    await pool.execute(
      "UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = ?",
      [hashedPassword, token]
    );

    return res.redirect(
      "/auth/reset-password?successMessage=Password reset successful. \nYou can now log in."
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.redirect(
      "/auth/reset-password?errorMessage=Internal server error"
    );
  }
};
