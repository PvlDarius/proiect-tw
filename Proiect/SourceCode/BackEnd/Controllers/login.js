// BackEnd/Controllers/login.js
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [result] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!result.length) {
      return res.render("login", {
        message: "Email is not registered",
      });
    }

    const user = result[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render("login", {
        message: "Incorrect password!",
      });
    }

    const token = jwt.sign(
      { userId: user.id, userRole: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Set the token as a cookie (you can modify this based on your needs)
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    req.user = user;

    // Redirect based on user role
    if (user.user_role === "admin") {
      return res.redirect("/admin/home");
    } else if (user.user_role === "doctor") {
      return res.redirect("/doctor/home");
    } else {
      return res.redirect("/patient/home");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
