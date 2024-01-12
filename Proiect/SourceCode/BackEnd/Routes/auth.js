const express = require("express");
const authController = require("../Controllers/auth");
const authMiddleware = require("../Middlewares/authMiddleware");
const path = require("path");
const multer = require("multer");
const mysql = require("mysql");
const { check, validationResult } = require("express-validator");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

// Connect to the database
db.connect((error) => {
  if (error) {
    console.log(error);
  }
});

const router = express.Router();
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../Temp/"), // Update the destination path
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/send-email", authController.passwordResetEmail);

router.get("/forgot-password", (req, res) => {
  res.render("login-signup-frame", {
    body: "forgot-password",
    message: "",
  });
});

router.get("/reset-password", (req, res) => {
  const token = req.query.token;
  res.clearCookie("jwt");
  res.render("login-signup-frame", {
    body: "reset-password",
    layout: false,
    token: token,
    message: "",
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/login");
});

router.get("/user-info", authMiddleware, authController.getUserInfo);

router.post(
  "/upload-profile-picture",
  authMiddleware,
  upload.single("profilePicture"),
  (req, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized. User not found." });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const fileName = `${user.userId}_${Date.now()}${path.extname(
      file.originalname
    )}`;
    const filePath = path.join(__dirname, "../../Public/UserImages", fileName);

    require("fs").rename(file.path, filePath, (err) => {
      if (err) {
        console.error("Error saving profile picture:", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        const updateQuery = "UPDATE users SET user_image = ? WHERE user_id = ?";
        db.query(
          updateQuery,
          [fileName, user.userId],
          (updateError, updateResults) => {
            if (updateError) {
              console.error("Error updating user record:", updateError);
              res.status(500).json({ error: "Internal server error" });
            } else {
              res.json({ success: true, fileName });
            }
          }
        );
      }
    });
  }
);

router.post(
  "/update-profile",
  [
    authMiddleware,
    check("firstName").notEmpty().withMessage("First name is required"),
    check("lastName").notEmpty().withMessage("Last name is required"),
    check("email").isEmail().withMessage("Invalid email address"),
    check("birthday").notEmpty().withMessage("Birthday is required"),
    check("gender").notEmpty().withMessage("Gender is required"),
    check("city").notEmpty().withMessage("City is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized. User not found." });
      }

      const { firstName, lastName, email, birthday, gender, city } = req.body;

      const updateQuery =
        "UPDATE users SET first_name = ?, last_name = ?, email = ?, birthday = ?, gender = ?, city = ? WHERE user_id = ?";

      db.query(
        updateQuery,
        [firstName, lastName, email, birthday, gender, city, user.userId],
        (updateError, updateResults) => {
          if (updateError) {
            console.error("Error updating user record:", updateError);
            res.status(500).json({ error: "Internal server error" });
          } else {
            res.json({
              success: true,
              message: "Profile updated successfully",
            });
          }
        }
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/appointments", async (req, res) => {
  try {
    // Extract appointment data from the request body
    const { doctorId, userId, selectedDate, selectedTime } = req.body;

    // Ensure that the appointment data is valid (you can add more validation as needed)
    if (!doctorId || !userId || !selectedDate || !selectedTime) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid appointment data" });
    }

    // Save the appointment data to the database
    const insertQuery =
      "INSERT INTO appointments (doctor_id, patient_id, appointment_date, appointment_hour) VALUES (?, ?, ?, ?)";
    db.query(
      insertQuery,
      [doctorId, userId, selectedDate, selectedTime],
      (insertError, insertResults) => {
        if (insertError) {
          console.error("Error inserting appointment record:", insertError);
          res
            .status(500)
            .json({ success: false, error: "Internal server error" });
        } else {
          res.json({
            success: true,
            message: "Appointment submitted successfully",
          });
        }
      }
    );
  } catch (error) {
    console.error("Error submitting appointment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
