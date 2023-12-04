const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

exports.signup = (req, res) => {
  const { first_name, last_name, email, password, confirmPassword } = req.body;

  if (!first_name || !last_name || !email || !password || !confirmPassword) {
    return res.redirect("/signup?errorMessage=All fields are required");
  }

  db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
        return res.redirect("/signup?errorMessage=An error occurred");
      }

      if (results.length > 0) {
        return res.redirect("/signup?errorMessage=This email is already used");
      } else if (password !== confirmPassword) {
        return res.redirect("/signup?errorMessage=Passwords do not match");
      }

      let hashedPassword = await bcrypt.hash(password, 8);

      db.query(
        "INSERT INTO users SET ?",
        {
          first_name: first_name,
          last_name: last_name,
          email: email,
          password: hashedPassword,
          user_role: "patient",
        },
        (error, results) => {
          if (error) {
            console.log(error);
            return res.redirect("/signup?errorMessage=Registration failed");
          } else {
            return res.redirect(
              "/signup?successMessage=Signed in successfully!"
            );
          }
        }
      );
    }
  );
};
