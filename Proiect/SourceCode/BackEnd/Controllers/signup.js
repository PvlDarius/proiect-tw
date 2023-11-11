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
  console.log(req.body);

  const { name, email, password, confirmPassword } = req.body;

  db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.log(error);
      }

      if (results.length > 0) {
        return res.render("signup", {
          message: "This email is already used",
        });
      } else if (password !== confirmPassword) {
        return res.render("signup", {
          message: "Passwords do not match",
        });
      }

      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);

      db.query(
        "INSERT INTO users SET ?",
        {
          name: name,
          email: email,
          password: hashedPassword,
          user_role: "patient",
        },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            return res.render("signup", {
              message: "Signed in successfully!",
            });
          }
        }
      );
    }
  );
};
