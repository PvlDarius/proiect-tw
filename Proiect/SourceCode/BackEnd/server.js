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

app.get("/admin/home", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "admin") {
    res.render("../Admin/admin-home");
  } else {
    res.status(403).send("Forbidden");
  }
});

app.get("/doctor/home", authMiddleware, checkUserRole, (req, res) => {
  if (req.userRole === "doctor") {
    res.render("../Doctors/doctor-home");
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
