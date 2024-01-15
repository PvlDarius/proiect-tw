// Functii folosite pentru componenta sidebar si intregul document

const imageFolderPath = "../Images/";

// Folosite pentru cand butonul hamburger este vizibil in design-ul responsive
const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("is-active");
  sidebar.classList.toggle("is-active");
});

document.addEventListener("click", (event) => {
  if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
    if (sidebar.classList.contains("is-active")) {
      sidebar.classList.remove("is-active");

      menuToggle.classList.remove("is-active", "hamburger-active");
    }
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  const socket = io();

  // socket.on("statusChange", ({ doctorId, newStatus }) => {
  //   const doctorName = getDoctorNameById(doctorId); // Replace with a function that fetches the doctor's name
  //   displayNotification(
  //     `Status change for doctor ${doctorName}: ${newStatus}`,
  //     "info"
  //   );
  // });

  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((menuItem) => {
    const page = menuItem.getAttribute("data-page");

    // Butonul de log-out functioneaza diferit de restul butoanelor, deoarece
    // apeleaza direct un API din backend in locul unei componente pagina, astfel il tratam diferit
    if (page !== "logout") {
      menuItem.addEventListener("click", async (event) => {
        event.preventDefault();
        loadPage(page);
      });
    }
  });

  // Pentru un aspect mai curat al URL-ului, il lasam doar sub forma "host/patient/"
  const currentPath = window.location.pathname.split("/").pop();
  const defaultPage = currentPath || "home";

  setActiveLink(defaultPage);
  fetchUserInfo(defaultPage);

  loadPage(defaultPage);
});

const logoutLink = document.querySelector(".menu-item[data-page='logout']");
logoutLink.addEventListener("click", () => {
  window.location.href = logoutLink.getAttribute("href");
});

function setActiveLink(page) {
  const activeClass = "active";
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((menuItem) => {
    const menuItemPage = menuItem.getAttribute("data-page");
    if (menuItemPage === page) {
      menuItem.classList.add(activeClass);
    } else {
      menuItem.classList.remove(activeClass);
    }
  });
}

// Functie care incarca continutul paginii alese din sidebar
async function loadPage(page) {
  try {
    const response = await fetch(`/patient/${page}`);
    const pageContent = await response.text();

    sidebar.classList.remove("is-active");
    menuToggle.classList.remove("is-active");

    document.querySelector(".main-content").innerHTML = pageContent;

    setActiveLink(page);

    fetchUserInfo(page);

    // Apelam functiile specifice paginii "appointments" doar cand aceasta e activa
    if (page === "appointments") {
      await fetchAndRenderDoctors();

      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          const searchQuery = searchInput.value.trim();
          fetchAndRenderDoctors(searchQuery);
        });

        const clearSearchIcon = document.getElementById("clearSearch");
        if (clearSearchIcon) {
          clearSearchIcon.addEventListener("click", () => {
            searchInput.value = "";
            fetchAndRenderDoctors();
          });
        }
      }
    }

    if (page === "home") {
      await fetchAndRenderAppointments();
    }

    if (page === "settings") {
      await fetchUserSettings();
    }

    if (page === "file") {
      const userId = await fetchUserInfo("file");
      openMedicalFile(userId.id);
    }
  } catch (error) {
    console.error("Error loading page:", error);
  }
}

// Functie care primeste detaliile despre utilizatorul conectat si le afiseaza unde este nevoie
async function fetchUserInfo(page) {
  try {
    const response = await fetch("/auth/user-info");
    const userInfo = await response.json();

    if (userInfo && userInfo.id !== undefined && userInfo.id !== null) {
      const userImageElement = document.querySelector(".user-img");
      const imagePath = `/UserImages/${userInfo.userImage}`;
      userImageElement.src = imagePath;

      if (page === "settings") {
        const currentProfilePicture = document.getElementById(
          "currentProfilePicture"
        );
        if (currentProfilePicture) {
          currentProfilePicture.src = imagePath;
        }

        const firstName = document.getElementById("firstNameInput");
        const lastName = document.getElementById("lastNameInput");
        const email = document.getElementById("emailInput");
        const birthday = document.getElementById("birthdayInput");
        const gender = document.getElementById("genderInput");
        const city = document.getElementById("cityInput");

        firstName.value = `${userInfo.firstName}`;
        lastName.value = `${userInfo.lastName}`;
        email.value = `${userInfo.email}`;
        birthday.value = new Date(userInfo.birthday).toLocaleDateString(
          "en-CA"
        );
        gender.value = `${userInfo.gender}`;
        city.value = `${userInfo.city}`;
      }

      const userNameElement = document.getElementById("user-name");
      userNameElement.textContent = `${userInfo.firstName} ${userInfo.lastName}`;

      const userRoleElement = document.getElementById("user-role");
      userRoleElement.textContent =
        userInfo.userRole.charAt(0).toUpperCase() + userInfo.userRole.slice(1);

      return userInfo; // Return the userInfo object
    } else {
      console.error("Error: userInfo or id is null");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user information:", error);
    return null;
  }
}

// In urma unor probleme cu preluarea token-ului jwt din cookies, am trimis token-ul prin URL,
// iar dupa preluare, l-am adaugat in sessionStorage si l-am sters din a fi vizibil
function getTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("token");
}

function removeTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, document.title, url.href);
}

const tokenFromUrl = getTokenFromUrl();

if (tokenFromUrl) {
  sessionStorage.setItem("jwt", tokenFromUrl);

  removeTokenFromUrl();
}

// Functii pentru pop-up-uri
let countdownTimeoutId;

function displayPopup(message, type) {
  const popup = document.getElementById("popup");
  const popupHeader = document.getElementById("popupHeader");
  const popupContent = document.getElementById("popupMessage");
  const overlay = document.getElementById("overlay");
  const countdownNumberEl = document.getElementById("countdown-number");
  const circle = document.querySelector("#countdown circle");

  // Stergem countdownul precedent daca exista
  if (countdownTimeoutId) {
    clearTimeout(countdownTimeoutId);
  }

  // Setam Header-ul in functie de tipul mesajului
  popupHeader.textContent =
    type === "success"
      ? "Success"
      : type === "error"
      ? "Error"
      : type === "warning"
      ? "Warning"
      : "";

  popupContent.textContent = message;

  // Adaugam si stergem clase in functie de tipul pop-up-ului
  popup.classList.remove("success-popup", "error-popup", "warning-popup");
  popup.classList.add(`${type}-popup`, "active");

  overlay.classList.add("active");

  // Creem o clona a cercului din timer si inlocuim originalul
  const newCircle = circle.cloneNode(true);
  circle.parentNode.replaceChild(newCircle, circle);

  // Adaugam animatia noului element
  newCircle.style.animation = "countdown 5s linear forwards";

  // Pornim cronometrul, iar la final inchidem pop-up-ul
  startCountdown(5, countdownNumberEl, function () {
    popup.classList.remove("active");
    overlay.classList.remove("active");
  });
}

// Functia cronometru
function startCountdown(duration, countdownElement, callback) {
  function updateCountdown() {
    countdownElement.textContent = duration;
    if (duration > 0) {
      duration--;
      countdownTimeoutId = setTimeout(updateCountdown, 1000);
    } else {
      if (callback) {
        callback();
      }
    }
  }

  updateCountdown();
}

// Functie pentru inchiderea manuala a pop-up-ului
function togglePopup() {
  const popup = document.getElementById("popup");
  const overlay = document.getElementById("overlay");

  // Stergem cronometrul daca se inchide manual
  if (countdownTimeoutId) {
    clearTimeout(countdownTimeoutId);
  }

  popup.classList.toggle("active");
  overlay.classList.toggle("active");
}

// Functii folosite in "home.ejs"
function displayNotification(message, type) {
  const notification = new Notification(type.toUpperCase(), {
    body: message,
    icon: "../Images/heart-pulse-solid-big.svg",
  });

  // You can customize the appearance or add event listeners to the notification as needed
  notification.onclick = () => {
    // Handle notification click event
    console.log(`Notification clicked: ${message}`);
  };
}

// Update the renderAppointments function to include notifications
const renderAppointments = async (appointments) => {
  const appointmentsContainer = document.getElementById(
    "appointments-container"
  );

  // Clear existing content
  appointmentsContainer.innerHTML = "";

  const appointmentsTitle = document.createElement("h2");
  appointmentsTitle.innerHTML = "My Appointments";
  appointmentsContainer.appendChild(appointmentsTitle);

  // Check if there are appointments
  if (appointments && appointments.length > 0) {
    // Iterate over each appointment and create div elements
    for (const appointment of appointments) {
      const appointmentDiv = document.createElement("div");
      appointmentDiv.classList.add("appointment-element");

      // Fetch doctor information
      const doctorInfo = await fetchDoctorInfoById(appointment.doctor_id);

      // Format the date and time
      const formattedDate = new Date(
        appointment.appointment_date
      ).toLocaleDateString("en-GB"); // DD/MM/YYYY
      const formattedTime = new Date(
        `2024-01-01T${appointment.appointment_hour}`
      ).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }); // HH:MM

      // Display doctor information and appointment details
      appointmentDiv.innerHTML = `
        <p>Doctor: ${doctorInfo.name}</p>
        <p>Specialization: ${doctorInfo.specialization}</p>
        <p>Clinic: ${doctorInfo.clinic}</p>
        <p>Date: ${formattedDate}</p>
        <p>Time: ${formattedTime}</p>
        <p>Status: <span class="status-color">${appointment.status.toUpperCase()}</span></p>
      `;

      const statusColor = appointmentDiv.querySelector(".status-color");

      // Set background color based on status
      switch (appointment.status.toLowerCase()) {
        case "pending":
          statusColor.style.backgroundColor = "yellow";
          break;
        case "cancelled":
          statusColor.style.backgroundColor = "red";
          break;
        case "accepted":
          statusColor.style.backgroundColor = "green";
          break;
        default:
          // Handle other statuses if needed
          break;
      }

      // Append the div to the container
      appointmentsContainer.appendChild(appointmentDiv);
    }
  } else {
    // If there are no appointments, display a message
    appointmentsContainer.textContent = "No appointments available.";
  }
};

async function fetchDoctorInfoById(doctorId) {
  try {
    const response = await fetch(`/api/doctors?doctorId=${doctorId}`);
    const doctorInfo = await response.json();
    return doctorInfo[0]; // Assuming the API returns an array of doctors; use the first one
  } catch (error) {
    console.error("Error fetching doctor information:", error);
    throw error;
  }
}

// Function to fetch and render appointments
const fetchAndRenderAppointments = async () => {
  const token = sessionStorage.getItem("jwt");
  try {
    const response = await fetch("/auth/appointments-info", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Parse the JSON response
      const data = await response.json();

      // Access the appointments data
      const appointments = data.appointments;

      // Render the appointments in the "appointments-container" div
      renderAppointments(appointments);
    } else {
      // Handle errors (e.g., display an error message)
      console.error("Error fetching appointments:", response.statusText);
    }
  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
  }
};

// Functii folosite exclusiv in "appointments.ejs"

// Preluarea informatiilor legate de doctori, cu filtrare
async function fetchAndRenderDoctors(searchQuery = "") {
  try {
    const activePage = document
      .querySelector(".menu-item.active")
      .getAttribute("data-page");

    if (activePage !== "appointments") {
      return;
    }

    const response = await fetch("/api/doctors");
    const doctors = await response.json();
    renderDoctors(doctors, searchQuery);
  } catch (error) {
    console.error("Error fetching and rendering doctors:", error);
  }
}

// Generarea cartonaselor cu doctori
function renderDoctors(doctors, searchQuery = "") {
  const doctorsContainer = document.querySelector(".doctors-container");

  if (!doctorsContainer) {
    console.error("Error: doctorsContainer is null");
    return;
  }

  doctorsContainer.innerHTML = "";

  doctors.forEach((doctor) => {
    if (
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      const doctorElement = document.createElement("div");
      doctorElement.classList.add("doctors-container-element");

      const doctorImageContainer = document.createElement("div");
      doctorImageContainer.classList.add("doctor-img-container");

      const doctorImage = document.createElement("img");
      doctorImage.src = imageFolderPath + doctor.image;
      doctorImage.alt = doctor.name;
      doctorImageContainer.appendChild(doctorImage);

      // Append the image container to the main container
      doctorElement.appendChild(doctorImageContainer);

      const doctorName = document.createElement("h3");
      doctorName.textContent = doctor.name;
      doctorElement.appendChild(doctorName);

      const doctorSpecialization = document.createElement("p");
      doctorSpecialization.textContent = doctor.specialization;
      doctorElement.appendChild(doctorSpecialization);

      const doctorClinic = document.createElement("p");
      doctorClinic.textContent = doctor.clinic;
      doctorElement.appendChild(doctorClinic);

      const appointmentButton = document.createElement("button");
      appointmentButton.textContent = "Make Appointment";
      appointmentButton.addEventListener("click", () =>
        openAppointmentForm(doctor)
      );

      const doctorIdInput = document.createElement("input");
      doctorIdInput.type = "hidden";
      doctorIdInput.name = "doctorId";
      doctorIdInput.value = doctor.id;
      doctorElement.appendChild(doctorIdInput);

      doctorElement.appendChild(appointmentButton);

      doctorsContainer.appendChild(doctorElement);
    }
  });
}

function openAppointmentForm(doctor) {
  // Get current date and time
  const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const currentTime = new Date().toTimeString().split(" ")[0]; // Format: HH:mm
  const formattedTime = currentTime.split(":").slice(0, 2).join(":");

  // Create appointment form
  const appointmentForm = document.createElement("div");
  appointmentForm.innerHTML = `
    <div class="appointment-form">
      <button onclick="backToDoctors()">Back</button>
      <h1>Make Appointment</h1>
      <input type="hidden" id="id" name="id" value="${doctor.id}">

      <div class="input-box">
        <label for="doctor">Doctor's name:</label><br>
        <i class="fa-solid fa-user-doctor"></i>
        <input type="text" id="doctor" value="${doctor.name}" readonly><br>
      </div>

      <div class="input-box">
        <label for="specialization">Specialization:</label><br>
        <i class="fa-solid fa-briefcase-medical"></i>
        <input type="text" id="specialization" value="${doctor.specialization}" readonly><br>
      </div>

      <div class="input-box">
        <label for="clinic">Clinic:</label><br>
        <i class="fa-solid fa-hospital"></i>
        <input type="text" id="clinic" value="${doctor.clinic}" readonly><br>
      </div>

      <div class="input-box">
        <label for="appointmentDate">Select Date:</label><br>
        <i class="fa-solid fa-calendar-days"></i>
        <input type="date" id="appointmentDate" value="${currentDate}" required><br>
      </div>

      <div class="input-box">
        <label for="appointmentTime">Select Time:</label><br>
        <i class="fa-solid fa-clock"></i>
        <input type="time" id="appointmentTime" value="${formattedTime}" required><br>
      </div>

      <button onclick="submitAppointmentForm()">Submit</button>
    </div>
  `;

  // Append the form to the main content container
  const mainContentContainer = document.getElementById(
    "main-content-container"
  );
  mainContentContainer.innerHTML = "";
  mainContentContainer.appendChild(appointmentForm);
}

async function backToDoctors() {
  loadPage("appointments");
}

async function submitAppointmentForm() {
  const userInfo = await fetchUserInfo("appointment-form");
  const doctorIdInput = document.getElementById("id");
  const appointmentDateInput = document.getElementById("appointmentDate");
  const appointmentTimeInput = document.getElementById("appointmentTime");
  const selectedDateTime = new Date(
    `${appointmentDateInput.value}T${appointmentTimeInput.value}`
  );
  const currentDateTime = new Date();

  if (selectedDateTime < currentDateTime) {
    displayPopup("Please select a date in the future.", "warning");
    return;
  }
  const doctorId = doctorIdInput.value;
  const userId = userInfo.id;
  const selectedDateFormatted = appointmentDateInput.value;
  const selectedTime = appointmentTimeInput.value;
  const appointmentData = {
    doctorId,
    userId,
    selectedDate: selectedDateFormatted,
    selectedTime,
  };

  try {
    const token = sessionStorage.getItem("jwt");
    if (!token) {
      displayPopup("User not authenticated. Please log in.", "error");
      return;
    }

    const response = await fetch("/auth/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(appointmentData),
    });

    const data = await response.json();

    if (response.ok) {
      displayPopup("Appointment submitted successfully!", "success");
    } else {
      displayPopup(data.error || "Error submitting appointment", "error");
    }
  } catch (error) {
    console.error("Error submitting appointment:", error);
    displayPopup("Error submitting appointment. Please try again.", "error");
  }
}

// Functii pentru "file.ejs"

async function openMedicalFile(patientId) {
  const token = sessionStorage.getItem("jwt");

  try {
    // Fetch all patient data including medical file information
    const response = await fetch(`/api/patients?patientId=${patientId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const patientData = await response.json();

      // Check if patientData is an array and not empty
      if (Array.isArray(patientData)) {
        if (patientData.length > 0) {
          const medicalFileData = patientData[0];
          populateMedicalFileData(medicalFileData);
        } else {
          const medicalFileData = patientData[0];
          populateMedicalFileData(medicalFileData);
          console.log("Patient has no medical history");
        }
      } else {
        // Handle the case where patientData is not an array (potential error)
        displayPopup(
          "Error fetching patient information:" + patientData,
          "error"
        );
        console.log("Patient data: ", patientData);
      }
    } else {
      displayPopup(
        "Error fetching patient information: " + response.statusText,
        "error"
      );
      console.log("Response data: ", response.statusText);
    }
  } catch (error) {
    displayPopup("Unexpected error:" + error, "error");
  }
}

function capitalizeFirstLetter(input) {
  if (typeof input !== "string" || input.length === 0) {
    return input;
  }

  return input.charAt(0).toUpperCase() + input.slice(1);
}

function formatName(name) {
  const words = name.split(" ");
  const capitalizedWords = words.map((word) => capitalizeFirstLetter(word));
  return capitalizedWords.join(" ");
}

function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  if (
    currentDate.getMonth() < birthDate.getMonth() ||
    (currentDate.getMonth() === birthDate.getMonth() &&
      currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function populateMedicalFileData(data) {
  const formattedName = data.name ? formatName(data.name) : "";
  const formattedGender = data.gender ? capitalizeFirstLetter(data.gender) : "";
  const formattedCity = data.city ? formatName(data.city) : "";
  document.getElementById("patientId").value = data.id;
  document.getElementById("name").value = formattedName;
  document.getElementById("gender").value = formattedGender;
  document.getElementById("city").value = formattedCity;
  document.getElementById("phone").value = data.phone;
  document.getElementById("email").value = data.email;
  document.getElementById("age").value = calculateAge(data.birthday) || "";
  document.getElementById("height").value = data.height || "";
  document.getElementById("weight").value = data.weight || "";
  const diagnosticsList = data.diagnostics ? data.diagnostics.split(",") : [];
  const medicationsList = data.medications ? data.medications.split(",") : [];

  const diagnosticsContainer = document.getElementById("diagnosticsList");
  diagnosticsContainer.innerHTML = "";
  diagnosticsList.forEach((diagnostic) => {
    const diagnosticItem = document.createElement("li");
    diagnosticItem.textContent = capitalizeFirstLetter(diagnostic);
    diagnosticsContainer.appendChild(diagnosticItem);
  });

  const medicationsContainer = document.getElementById("medicationsList");
  medicationsContainer.innerHTML = "";
  medicationsList.forEach((medication) => {
    const medicationItem = document.createElement("li");
    medicationItem.textContent = capitalizeFirstLetter(medication);
    medicationsContainer.appendChild(medicationItem);
  });
}

// Functii folosite exclusiv in "settings.ejs"

// Afisarea noii imagini alese pentru profil
function displaySelectedPicture(input) {
  const currentProfilePicture = document.getElementById(
    "currentProfilePicture"
  );
  const file = input.files[0];

  if (file) {
    const allowedTypes = ["image/png", "image/jpeg"];
    if (allowedTypes.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = function (e) {
        currentProfilePicture.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      displayPopup(
        "Please select a valid image file (PNG or JPEG).",
        "warning"
      );
      input.value = "";
      currentProfilePicture.src = "";
    }
  }
}

// Salvarea in baza de date a noii imagini
function saveProfilePicture() {
  const fileInput = document.getElementById("profilePictureInput");
  const file = fileInput.files[0];

  if (file) {
    const formData = new FormData();
    formData.append("profilePicture", file);

    const token = sessionStorage.getItem("jwt");

    if (token) {
      fetch("/auth/upload-profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          displayPopup("Profile picture updated successfully!", "success");
          fetchUserInfo("settings");
        })
        .catch((error) =>
          displayPopup("Error uploading profile picture:" + error, "error")
        );
    } else {
      displayPopup("Token is null in sessionStorage.", "warning");
    }
  } else {
    displayPopup("Please select a file!", "warning");
  }
}

// Salvarea noilor informatii legate de profil
function handleSaveChanges() {
  const firstNameInput = document.getElementById("firstNameInput");
  const lastNameInput = document.getElementById("lastNameInput");
  const emailInput = document.getElementById("emailInput");
  const birthdayInput = document.getElementById("birthdayInput");
  const genderInput = document.getElementById("genderInput");
  const cityInput = document.getElementById("cityInput");

  if (firstNameInput.value && lastNameInput.value && emailInput.value) {
    const token = sessionStorage.getItem("jwt");

    const data = {
      firstName: firstNameInput.value,
      lastName: lastNameInput.value,
      email: emailInput.value,
      birthday: birthdayInput.value,
      gender: genderInput.value,
      city: cityInput.value,
    };

    fetch("/auth/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data && data.success) {
          displayPopup("Profile updated successfully", "success");
          fetchUserInfo("settings");
        } else {
          displayPopup("Error updating profile");
          console.error(
            "Error updating profile:" + data && data.errors,
            "error"
          );
        }
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        displayPopup("Error updating profile. Please try again.", "error");
      });
  }
}

// Apelarea API-ului pentru trimiterea email-ului

async function sendPasswordResetEmail() {
  const email = document.getElementById("emailInput").value;

  try {
    const response = await fetch("/auth/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      displayPopup(data.message, "success");
    } else {
      displayPopup(
        data.error || "Failed to send reset password email",
        "error"
      );
    }
  } catch (error) {
    displayPopup("Failed to send reset password email", "error");
  }
}

// Function to toggle notification setting and save it
// Updated toggleNotificationSetting to return a boolean
// Updated toggleNotificationSetting to return a boolean
function toggleNotificationSetting() {
  const notificationToggle = document.getElementById("notificationToggle");
  const receiveNotifications = notificationToggle.checked;

  // Toggle notification permission based on user preference
  toggleNotificationPermission(receiveNotifications);

  return receiveNotifications;
}

function toggleNotificationPermission(receiveNotifications) {
  if (receiveNotifications) {
    // Request notification permission if not granted
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  } else {
    // Revoke notification permission if it was previously granted
    if (Notification.permission === "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "denied") {
          console.log("Notification permission revoked");
        }
      });
    }
  }
}

// Function to save user settings
async function saveUserSettings() {
  try {
    const receiveNotifications = toggleNotificationSetting();

    const response = await fetch(
      "http://localhost:8080/auth/save-user-settings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any additional headers if needed
        },
        body: JSON.stringify({ receiveNotifications }),
      }
    );

    const data = await response.json();

    // Handle the response as needed
    if (response.ok) {
      displayPopup("Settings updated successfully", "success");
      // Display a confirmation message or update UI as needed
      const message = receiveNotifications
        ? "You will now receive notifications."
        : "You have turned off notifications.";
      displayNotification(message, "info");
    } else {
      console.error("Error saving user settings:", data.error);
    }
  } catch (error) {
    console.error("Error saving user settings:", error);
  }
}

async function fetchUserSettings() {
  try {
    const response = await fetch("http://localhost:8080/auth/user-settings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add any additional headers if needed
      },
    });

    const data = await response.json();

    if (response.ok) {
      // If the request is successful, update the UI with user settings
      updateUIWithUserSettings(data.userSettings);
    } else {
      console.error("Error fetching user settings:", data.error);
    }
  } catch (error) {
    console.error("Error fetching user settings:", error);
  }
}

// Function to update UI with user settings
function updateUIWithUserSettings(userSettings) {
  const notificationToggle = document.getElementById("notificationToggle");

  if ("receiveNotifications" in userSettings) {
    notificationToggle.checked = userSettings.receiveNotifications;
  }
}
