const express = require("express");
const authController = require("../Controllers/auth");
const authMiddleware = require("../Middlewares/authMiddleware");
const path = require("path");
const multer = require("multer");
const mysql = require("mysql");
const { check, validationResult } = require("express-validator");
const { io, handleStatusChange } = require("../server");

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
router.post("/add-new-doctor", authController.newDoctor);
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

router.get("/user-settings", authMiddleware, authController.getUserSettings);

router.get(
  "/appointments-info",
  authMiddleware,
  authController.getAppointmentsInfo
);

router.get(
  "/doctor-appointments",
  authMiddleware,
  authController.getDoctorAppointmentsInfo
);

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

    // Check if the patient already has an appointment with the given doctor
    const existingAppointmentQuery =
      "SELECT * FROM appointments WHERE doctor_id = ? AND patient_id = ?";
    db.query(
      existingAppointmentQuery,
      [doctorId, userId],
      (existingAppointmentError, existingAppointmentResults) => {
        if (existingAppointmentError) {
          console.error(
            "Error checking existing appointment:",
            existingAppointmentError
          );
          return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
        }

        if (existingAppointmentResults.length > 0) {
          return res.status(400).json({
            success: false,
            error: "Patient already has an appointment with the given doctor",
          });
        }

        // Create a new Date object representing the selected date and time
        const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);

        // Create a new Date object for the current date and time
        const currentDateTime = new Date();

        // Check if the appointment has passed
        if (selectedDateTime < currentDateTime) {
          // If it has passed, set the status to "expired"
          const expiredStatusQuery =
            "INSERT INTO appointments (doctor_id, patient_id, appointment_date, appointment_hour, status) VALUES (?, ?, ?, ?, ?)";
          db.query(
            expiredStatusQuery,
            [doctorId, userId, selectedDate, selectedTime, "expired"],
            (expiredStatusError, expiredStatusResults) => {
              if (expiredStatusError) {
                console.error(
                  "Error setting expired status:",
                  expiredStatusError
                );
                return res
                  .status(500)
                  .json({ success: false, error: "Internal server error" });
              }

              io.emit("statusChange", {
                appointmentId: expiredStatusResults.insertId,
                newStatus: "expired",
              });
              // Continue with the response as needed
            }
          );
        } else {
          // If it hasn't passed, save the appointment data to the database
          const insertQuery =
            "INSERT INTO appointments (doctor_id, patient_id, appointment_date, appointment_hour) VALUES (?, ?, ?, ?)";
          db.query(
            insertQuery,
            [doctorId, userId, selectedDate, selectedTime],
            (insertError, insertResults) => {
              if (insertError) {
                console.error(
                  "Error inserting appointment record:",
                  insertError
                );
                return res
                  .status(500)
                  .json({ success: false, error: "Internal server error" });
              }

              io.emit("statusChange", {
                appointmentId: insertResults.insertId,
                newStatus: "pending", // Modify this based on your logic
              });
              // Continue with the response as needed
              res.json({
                success: true,
                message: "Appointment submitted successfully",
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Error submitting appointment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Assuming you have the user ID available in the request
router.post("/save-user-settings", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { receiveNotifications } = req.body;

    // Delete the existing entry for the user
    const deleteQuery = "DELETE FROM user_settings WHERE user_id = ?";
    db.query(deleteQuery, [userId], (deleteError, deleteResults) => {
      if (deleteError) {
        console.error("Error deleting user setting:", deleteError);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Insert the new user setting
      const insertQuery =
        "INSERT INTO user_settings (user_id, receive_notifications) VALUES (?, ?)";
      db.query(
        insertQuery,
        [userId, receiveNotifications],
        (insertError, insertResults) => {
          if (insertError) {
            console.error("Error inserting user setting:", insertError);
            return res.status(500).json({ error: "Internal server error" });
          }

          res.json({ success: true });
        }
      );
    });
  } catch (error) {
    console.error("Error saving user setting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/update-appointment-status", async (req, res) => {
  try {
    const { appointmentId, newStatus } = req.body;

    // Ensure that the appointmentId and newStatus are provided
    if (!appointmentId || !newStatus) {
      return res.status(400).json({ success: false, error: "Invalid data" });
    }

    // Validate that the new status is one of the allowed values ('pending', 'accepted', 'cancelled')
    const allowedStatuses = ["pending", "accepted", "cancelled"];
    if (!allowedStatuses.includes(newStatus.toLowerCase())) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    // Use the getDoctorIdForAppointment function to retrieve the doctorId
    getDoctorIdForAppointment(appointmentId, (doctorId) => {
      if (doctorId === null) {
        return res.status(404).json({
          success: false,
          error: "Appointment not found or doctorId not available",
        });
      }

      // Update the appointment status in your database
      const updateStatusQuery =
        "UPDATE appointments SET status = ? WHERE appointment_id = ?";
      db.query(
        updateStatusQuery,
        [newStatus, appointmentId],
        (updateError, updateResults) => {
          if (updateError) {
            console.error("Error updating appointment status:", updateError);
            return res
              .status(500)
              .json({ success: false, error: "Internal server error" });
          }

          if (updateResults.affectedRows === 0) {
            return res
              .status(404)
              .json({ success: false, error: "Appointment not found" });
          }

          // Notify clients about the status change
          io.emit("statusChange", {
            appointmentId,
            newStatus,
            doctorId,
          });

          // Send a success response
          res.status(200).json({
            success: true,
            message: "Appointment status updated successfully",
          });
        }
      );
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

function getDoctorIdForAppointment(appointmentId, callback) {
  const query = "SELECT doctor_id FROM appointments WHERE appointment_id = ?";
  db.query(query, [appointmentId], (error, results) => {
    if (error) {
      console.error("Error retrieving doctorId for appointment:", error);
      return callback(null); // Handle the error appropriately
    }

    if (results.length > 0) {
      const doctorId = results[0].doctor_id;
      callback(doctorId);
    } else {
      console.error("Appointment not found:", appointmentId);
      callback(null); // Handle the case where the appointment is not found
    }
  });
}

router.post("/update-medical-file", async (req, res) => {
  try {
    // Extract data from the request body
    const { patientId, age, height, weight, diagnostics, medications } =
      req.body;

    // Update the medical file data in the database
    const updateQuery =
      "UPDATE patients SET age= ?, height = ?, weight = ?, diagnostics = ?, medications = ? WHERE user_id = ?";

    db.query(
      updateQuery,
      [age, height, weight, diagnostics, medications, patientId],
      (updateError, updateResults) => {
        if (updateError) {
          console.error("Error updating medical file:", updateError);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Check if any rows were affected
        if (updateResults.affectedRows === 0) {
          // If no rows were affected, the medical file may not exist
          return res.status(404).json({ error: "Medical file not found" });
        }

        // Send a success response
        res.status(200).json({ message: "Medical file updated successfully" });
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("Error updating medical file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
