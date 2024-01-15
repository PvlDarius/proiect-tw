const express = require("express");
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
const authMiddleware = require("./Middlewares/authMiddleware");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIO = require("socket.io");

dotenv.config({ path: "./.env" });

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Move the handleStatusChange function outside the connection block
function handleStatusChange(doctorId, newStatus) {
  // Perform the status change logic

  // Emit a Socket.IO event for status change
  io.emit("statusChange", { doctorId, newStatus });
}

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle disconnection if needed
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  // Add your Socket.IO event handlers here
});

module.exports = { io, handleStatusChange };

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
  const userRole = req.user ? req.user.userRole : null;

  if (userRole) {
    req.userRole = userRole;
  }

  next();
};

app.get("/api/doctors", (req, res) => {
  const doctorId = req.query.doctorId; // Get the doctor ID from query parameters

  let query =
    "SELECT * FROM doctors JOIN users ON doctors.user_id = users.user_id";

  // If doctorId is provided, add a WHERE clause to filter by doctor ID
  if (doctorId) {
    query += " WHERE doctors.doctor_id = ?";
  }

  db.query(query, [doctorId], (error, results) => {
    if (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ error: "Internal server error" });
    } else {
      const doctorsData = results.map((doctor) => ({
        id: `${doctor.doctor_id}`,
        name: `${doctor.first_name} ${doctor.last_name}`,
        image: doctor.user_image,
        specialization: doctor.specialization,
        clinic: doctor.clinic,
      }));

      res.json(doctorsData);
    }
  });
});

app.get("/api/patients", (req, res) => {
  const patientId = req.query.patientId;
  const userId = req.query.userId;

  let query =
    "SELECT * FROM patients JOIN users ON patients.user_id = users.user_id";

  if (patientId) {
    query += " WHERE patients.user_id = ?";
  }

  if (userId) {
    query += " WHERE patients.user_id = ?";
  }

  db.query(query, [patientId], (error, results) => {
    if (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Internal server error" });
    } else {
      const patientsData = results.map((patient) => ({
        id: `${patient.user_id}`,
        name: `${patient.first_name} ${patient.last_name}`,
        image: patient.user_image,
        birthday: patient.birthday,
        gender: patient.gender,
        city: patient.city,
        phone: patient.phone,
        email: patient.email,
        age: patient.age,
        height: patient.height,
        weight: patient.weight,
        diagnostics: patient.diagnostics,
        medications: patient.medications,
      }));

      res.json(patientsData);
    }
  });
});

//   const appointmentId = req.query.appointmentId;
//   const doctorId = req.query.doctorId;
//   const patientId = req.query.patientId;
//   const status = req.query.status;

//   let query =
//     "SELECT * FROM appointments " +
//     "JOIN doctors ON appointments.doctor_id = doctors.doctor_id " +
//     "JOIN patients ON appointments.patient_id = patients.user_id " +
//     "JOIN users AS doctor_users ON doctors.user_id = doctor_users.user_id " +
//     "JOIN users AS patient_users ON patients.user_id = patient_users.user_id";

//   const queryParams = [];

//   if (appointmentId) {
//     query += " WHERE appointments.appointment_id = ?";
//     queryParams.push(appointmentId);
//   } else {
//     if (doctorId) {
//       query += " WHERE appointments.doctor_id = ?";
//       queryParams.push(doctorId);
//     }

//     if (patientId) {
//       if (queryParams.length > 0) {
//         query += " AND appointments.patient_id = ?";
//       } else {
//         query += " WHERE appointments.patient_id = ?";
//       }
//       queryParams.push(patientId);
//     }

//     if (status) {
//       if (queryParams.length > 0) {
//         query += " AND appointments.status = ?";
//       } else {
//         query += " WHERE appointments.status = ?";
//       }
//       queryParams.push(status);
//     }
//   }

//   db.query(query, queryParams, (error, results) => {
//     if (error) {
//       console.error("Error fetching appointments:", error);
//       res.status(500).json({ error: "Internal server error" });
//     } else {
//       const appointmentsData = results.map((appointment) => ({
//         id: `${appointment.appointment_id}`,
//         doctor: {
//           id: `${appointment.doctor_id}`,
//           name: `${appointment.first_name} ${appointment.last_name}`,
//           image: appointment.user_image,
//           specialization: appointment.specialization,
//           clinic: appointment.clinic,
//         },
//         patient: {
//           id: `${appointment.patient_id}`,
//           name: `${appointment.first_name} ${appointment.last_name}`,
//           image: appointment.user_image,
//           age: appointment.age,
//           height: appointment.height,
//           weight: appointment.weight,
//         },
//         date: appointment.appointment_date,
//         hour: appointment.appointment_hour,
//         status: appointment.status,
//       }));

//       res.json(appointmentsData);
//     }
//   });
// });

app.get("/api/statistics", (req, res) => {
  let doctorsCount, patientsCount, hospitalsCount, diagnosticsCount;

  // Count doctors
  db.query("SELECT COUNT(*) AS count FROM doctors", (error, results) => {
    if (error) {
      console.error("Error counting doctors:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    doctorsCount = results[0].count;

    // Count patients
    db.query("SELECT COUNT(*) AS count FROM patients", (error, results) => {
      if (error) {
        console.error("Error counting patients:", error);
        res.status(500).json({ error: "Internal server error" });
        return;
      }
      patientsCount = results[0].count;

      // Hardcoded hospitals count (replace with your actual value)
      hospitalsCount = 5; // Replace with your actual value

      // Hardcoded diagnostics count
      diagnosticsCount = 10; // Replace with your actual value

      // Send the statistics as JSON response
      res.json({
        doctorsCount,
        patientsCount,
        hospitalsCount,
        diagnosticsCount,
      });
    });
  });
});

app.use(express.static(path.join(__dirname, "../FrontEnd")));
app.use(express.static(path.join(__dirname, "../Public")));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../FrontEnd/LoginSignup"));

app.use("/", require("./Routes/pages"));
app.use("/auth", require("./Routes/auth"));

app.get("/auth/reset-password", (req, res) => {
  const { token } = req.query;
  res.render("reset-password", { token, message: "" });
});

app.get("/join", (req, res) => {
  res.render("login-signup-frame"); // Assuming 'auth-frame' is the name of your EJS file
});

app.use(checkUserRole);
app.use(authMiddleware);

app.get("/admin/", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "admin") {
    res.render("../Admin/admin-frame");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/admin/home", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "admin") {
    res.render("../Admin/home");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/admin/appointments", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "admin") {
    res.render("../Admin/appointments");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/admin/doctors", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "admin") {
    res.render("../Admin/doctors");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/admin/patients", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "admin") {
    res.render("../Admin/patients");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/admin/settings", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "admin") {
    res.render("../Admin/settings");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/doctor/", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "doctor") {
    res.render("../Doctors/doctor-frame");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/doctor/home", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "doctor") {
    res.render("../Doctors/home");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/doctor/appointments", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "doctor") {
    res.render("../Doctors/appointments");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/doctor/patients", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "doctor") {
    res.render("../Doctors/patients");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/doctor/medical-file", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "doctor") {
    res.render("../Doctors/medical-file");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/doctor/settings", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "doctor") {
    res.render("../Doctors/settings");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/patient/", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "patient") {
    res.render("../Patients/patient-frame");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/patient/home", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "patient") {
    res.render("../Patients/home");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/patient/appointments", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "patient") {
    res.render("../Patients/appointments");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get(
  "/patient/appointment-form",
  authMiddleware,
  checkUserRole,
  (req, res) => {
    if (req.userRole === "patient") {
      res.render("../Patients/appointment-form");
    } else {
      res.status(403).send("Forbidden");
    }
  }
);

app.get("/patient/file", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "patient") {
    res.render("../Patients/file");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/patient/settings", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "patient") {
    res.render("../Patients/settings");
  } else {
    res.status(403).send("Forbidden");
  }
});

// Catch-all route for other paths
app.get("*", (req, res) => {
  res.status(404).send("Page not found");
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
