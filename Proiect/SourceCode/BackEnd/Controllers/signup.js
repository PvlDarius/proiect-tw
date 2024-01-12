const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

exports.signup = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    confirmPassword,
    birthday,
    gender,
    city,
    phone,
  } = req.body;

  if (
    !first_name ||
    !last_name ||
    !email ||
    !password ||
    !confirmPassword ||
    !birthday ||
    !gender ||
    !city ||
    !phone
  ) {
    return res.redirect("/signup?errorMessage=All fields are required");
  }

  try {
    const results = await db.query("SELECT email FROM users WHERE email = ?", [
      email,
    ]);

    if (results.length > 0) {
      return res.redirect("/signup?errorMessage=This email is already used");
    } else if (password !== confirmPassword) {
      return res.redirect("/signup?errorMessage=Passwords do not match");
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    await db.query("INSERT INTO users SET ?", {
      first_name,
      last_name,
      email,
      password: hashedPassword,
      user_role: "patient",
      birthday,
      gender,
      city,
      phone,
    });

    return res.redirect("/signup?successMessage=Signed in successfully!");
  } catch (error) {
    console.error(error);
    return res.redirect("/signup?errorMessage=Registration failed");
  }
};
