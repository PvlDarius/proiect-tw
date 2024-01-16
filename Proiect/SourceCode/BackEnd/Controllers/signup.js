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
    // Start a transaction
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

    // Query the max user_id from the users table
    const maxUserIdResult = await db.query(
      "SELECT MAX(user_id) AS max_user_id FROM users"
    );

    // Get the max user_id
    const userId = maxUserIdResult[0].max_user_id;

    // Calculate age from birthday considering month and day
    const birthDate = new Date(birthday);
    const currentDate = new Date();

    let age = currentDate.getFullYear() - birthDate.getFullYear();

    // Check if the birthday for the current year has already occurred
    if (
      currentDate.getMonth() < birthDate.getMonth() ||
      (currentDate.getMonth() === birthDate.getMonth() &&
        currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // Insert patient data into 'patients' table using the obtained user_id
    await db.query("INSERT INTO patients SET ?", {
      user_id: userId,
      age,
      // Add other patient-related fields as needed
    });

    return res.redirect("/signup?successMessage=Signed in successfully!");
  } catch (error) {
    console.error(error);
    return res.redirect("/signup?errorMessage=Registration failed");
  }
};

const insertUser = async (userData) => {
  return new Promise((resolve, reject) => {
    db.query("INSERT INTO users SET ?", userData, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results.insertId);
      }
    });
  });
};

const insertDoctor = async (doctorData) => {
  return new Promise((resolve, reject) => {
    db.query("INSERT INTO doctors SET ?", doctorData, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.newDoctor = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    birthday,
    gender,
    city,
    clinic,
    specialization,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !confirmPassword ||
    !birthday ||
    !gender ||
    !city ||
    !clinic ||
    !specialization
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const results = await db.query("SELECT email FROM users WHERE email = ?", [
      email,
    ]);

    if (results.length > 0) {
      return res.status(400).json({ error: "This email is already used" });
    } else if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    // Start a transaction
    await db.beginTransaction();

    try {
      // Insert user data into 'users' table
      const userId = await insertUser({
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        user_role: "doctor",
        birthday,
        gender,
        city,
        phone: null, // Assuming phone is not applicable to doctors
      });

      // Insert doctor data into 'doctors' table using the obtained user_id
      await insertDoctor({
        user_id: userId,
        clinic,
        specialization,
        // Add other doctor-related fields as needed
      });

      // Commit the transaction
      await db.commit();

      return res
        .status(201)
        .json({ success: "Doctor registered successfully" });
    } catch (error) {
      // Rollback the transaction in case of an error
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  } finally {
    // Ensure that the connection is released
    db.end();
  }
};
