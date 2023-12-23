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

  if (!email || !password) {
    return res.redirect("/login?errorMessage=All fields are required");
  }

  try {
    const [result] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!result.length) {
      return res.redirect("/login?errorMessage=This user is not registered!");
    }

    const user = result[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.redirect("/login?errorMessage=Incorrect password!");
    }

    const token = jwt.sign(
      { userId: user.user_id, userRole: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const isProduction = process.env.NODE_ENV === "production" || false;

    // Set the token as a cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: isProduction, // Set to true in production
      sameSite: "Strict",
    });

    if (user.user_role === "admin") {
      return res.redirect(`/admin/home?token=${token}`);
    } else if (user.user_role === "doctor") {
      return res.redirect(`/doctor/home?token=${token}`);
    } else {
      return res.redirect(`/patient/?token=${token}`);
    }
  } catch (error) {
    console.error(error);
    return res.redirect("/login?errorMessage=An error occurred");
  }
};
