const { signup } = require("./signup");
const { login } = require("./login");
const { forgotPassword, resetPassword } = require("./password");
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

exports.getUserInfo = async (req, res) => {
  const userRole = req.user ? req.user.userRole : null;

  if (!userRole) {
    return res
      .status(401)
      .json({ error: "Unauthorized. User role not found." });
  }

  try {
    const [result] = await pool.execute(
      "SELECT * FROM users WHERE user_role = ?",
      [userRole]
    );

    if (result.length > 0) {
      const user = result[0];

      // Send only necessary user information to avoid exposing sensitive data
      const userInfo = {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        userRole: user.user_role,
        userImage: user.user_image,
        // Add other necessary user properties here
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
