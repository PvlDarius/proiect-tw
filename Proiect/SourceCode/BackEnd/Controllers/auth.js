const { signup } = require("./signup");
const { login } = require("./login");
const {
  forgotPassword,
  resetPassword,
  passwordResetEmail,
} = require("./password");
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

exports.signup = signup;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.passwordResetEmail = passwordResetEmail;

exports.getUserInfo = async (req, res) => {
  const userId = req.user ? req.user.userId : null;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. User ID not found." });
  }

  try {
    const [result] = await pool.execute(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );

    if (result.length > 0) {
      const user = result[0];
      const userInfo = {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        userRole: user.user_role,
        userImage: user.user_image,
        birthday: user.birthday,
        gender: user.gender,
        city: user.city,
        phone: user.phone,
      };

      res.json(userInfo);
    } else {
      res.status(401).json({ error: "Unauthorized. User not found." });
    }
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUserSettings = async (req, res) => {
  const userId = req.user ? req.user.userId : null;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. User ID not found." });
  }

  try {
    const [result] = await pool.execute(
      "SELECT * FROM user_settings WHERE user_id = ?",
      [userId]
    );

    if (result.length > 0) {
      // If user settings are found, send them to the client
      const userSettings = {
        receiveNotifications: result[0].receive_notifications,
        theme: result[0].theme,
        // Add other settings as needed
      };

      res.json({ success: true, userSettings });
    } else {
      // If no user settings are found, you can send default settings or an empty object
      res.json({ success: true, userSettings: {} });
    }
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAppointmentsInfo = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized. User not found." });
    }

    const userId = user.userId;

    // Extract filter parameters from query
    const { doctorId, specialization, clinic } = req.query;

    // Construct the base query
    let getAppointmentsQuery =
      "SELECT * FROM appointments WHERE patient_id = ?";

    // Add filters to the query if provided
    if (doctorId) {
      getAppointmentsQuery += " AND doctor_id = ?";
    }

    if (specialization) {
      getAppointmentsQuery += " AND specialization = ?";
    }

    if (clinic) {
      getAppointmentsQuery += " AND clinic = ?";
    }

    // Execute the query with appropriate parameters
    let queryParams = [userId];

    if (doctorId) {
      queryParams.push(doctorId);
    }

    if (specialization) {
      queryParams.push(specialization);
    }

    if (clinic) {
      queryParams.push(clinic);
    }

    const [results] = await pool.execute(getAppointmentsQuery, queryParams);

    res.json({ success: true, appointments: results });
  } catch (error) {
    console.error("Error retrieving appointments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
