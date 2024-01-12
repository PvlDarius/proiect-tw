const { signup } = require("./signup");
const { login } = require("./login");
const {
  forgotPassword,
  resetPassword,
  passwordResetEmail,
} = require("./password");
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

exports.signup = signup;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.passwordResetEmail = passwordResetEmail;

exports.getUserInfo = async (req, res) => {
  const userId = req.user ? req.user.userId : null;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. User ID not found." });
  }

  try {
    const [result] = await pool.execute(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );

    if (result.length > 0) {
      const user = result[0];
      const userInfo = {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        userRole: user.user_role,
        userImage: user.user_image,
        birthday: user.birthday,
        gender: user.gender,
        city: user.city,
        phone: user.phone,
      };

      res.json(userInfo);
    } else {
      res.status(401).json({ error: "Unauthorized. User not found." });
    }
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
