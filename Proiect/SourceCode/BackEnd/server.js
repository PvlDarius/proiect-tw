const express = require("express");
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
const authMiddleware = require("./Middlewares/authMiddleware");
const cookieParser = require("cookie-parser");

dotenv.config({ path: "./.env" });

const app = express();

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("MySQL Connected");
  }
});

app.use(cookieParser());

const checkUserRole = (req, res, next) => {
  // Assuming you store user info in req.user after authentication
  const userRole = req.user ? req.user.user_role : null;

  if (userRole) {
    req.userRole = userRole; // Attach user role to the request for later use
  }

  next();
};

// Serve static files from the "FrontEnd" directory
app.use(express.static(path.join(__dirname, "../FrontEnd")));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set the view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../FrontEnd/LoginSignup"));

app.use("/", require("./Routes/pages"));
app.use("/auth", require("./Routes/auth"));

// Use the middleware for all routes
app.use(checkUserRole);
app.use(authMiddleware);

app.get("/admin/home", authMiddleware, (req, res) => {
  res.render("../Admin/admin-home");
});

app.get("/doctor/home", authMiddleware, (req, res) => {
  res.render("../Doctors/doctor-home");
});

app.get("/patient/home", authMiddleware, (req, res) => {
  res.render("../Patients/patient-home");
});

// Catch-all route for other paths
app.get("*", (req, res) => {
  res.status(404).send("Page not found");
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
});
