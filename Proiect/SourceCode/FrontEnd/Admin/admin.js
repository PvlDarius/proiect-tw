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
async function loadPage(page, patientId) {
  try {
    const response = await fetch(`/admin/${page}`);
    const pageContent = await response.text();

    sidebar.classList.remove("is-active");
    menuToggle.classList.remove("is-active");

    document.querySelector(".main-content").innerHTML = pageContent;

    setActiveLink(page);

    fetchUserInfo(page);

    // Apelam functiile specifice paginii "appointments" doar cand aceasta e activa
    if (page === "appointments") {
      await fetchAndRenderAppointments();
      document.getElementById("statusFilter").addEventListener("change", () => {
        const selectedValue = document.getElementById("statusFilter").value;
        fetchAndRenderAppointments(selectedValue);
      });
    }

    if (page === "patients") {
      fetchAndRenderPatients();

      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          const searchQuery = searchInput.value.trim();
          fetchAndRenderPatients(searchQuery);
        });

        const clearSearchIcon = document.getElementById("clearSearch");
        if (clearSearchIcon) {
          clearSearchIcon.addEventListener("click", () => {
            searchInput.value = "";
            fetchAndRenderPatients();
          });
        }
      }
    }

    if (page === "doctors") {
      fetchAndRenderDoctors();

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

    if (page === "settings") {
      await fetchUserSettings();
    }

    // if (page === "medical-file") {
    //   openMedicalFile(patientId);
    // }
  } catch (error) {
    console.log("Error loading page: " + error.message, "error");
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
      console.log("Error: userInfo or id is null", "error");
      return null;
    }
  } catch (error) {
    console.log("Error fetching user information:" + error.message, "error");
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

  const statusFilterLabel = document.createElement("label");
  statusFilterLabel.setAttribute("for", "statusFilter");
  statusFilterLabel.textContent = "Filter by Status:";
  const statusFilterSelect = document.createElement("select");
  statusFilterSelect.setAttribute("id", "statusFilter");
  statusFilterSelect.innerHTML = `
    <option value="">All</option>
    <option value="pending">Pending</option>
    <option value="accepted">Accepted</option>
    <option value="cancelled">Cancelled</option>
  `;
  statusFilterSelect.addEventListener("change", () => {
    // Filter appointments based on status
    const selectedStatus = statusFilterSelect.value.toLowerCase();
    const filteredAppointments = appointments.filter(
      (appointment) =>
        selectedStatus === "" ||
        appointment.status.toLowerCase() === selectedStatus
    );
    renderAppointments(filteredAppointments);
  });

  // Check if there are appointments
  if (appointments && appointments.length > 0) {
    // Iterate over each appointment and create div elements
    for (const appointment of appointments) {
      const appointmentDiv = document.createElement("div");
      appointmentDiv.classList.add("appointment-element");

      // Fetch doctor information
      const doctorInfo = await fetchDoctorInfoById(appointment.doctor_id);

      // Fetch patient information
      const patientInfo = await fetchPatientInfoById(appointment.patient_id);

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

      // Display patient information and appointment details
      appointmentDiv.innerHTML = `
        <p>Doctor: ${doctorInfo ? doctorInfo.name : "Unknown"}</p>
        <p>Patient: ${patientInfo ? patientInfo.name : "Unknown"}</p>
        <p>Date: ${formattedDate}</p>
        <p>Time: ${formattedTime}</p>
        <p>Status: <span class="status-color">${appointment.status.toUpperCase()}</span></p>
      `;

      // Set background color based on status
      const statusColor = appointmentDiv.querySelector(".status-color");
      switch (appointment.status.toLowerCase()) {
        case "pending":
          statusColor.style.backgroundColor = "yellow";
          break;
        case "cancelled":
          statusColor.style.backgroundColor = "#ff0021";
          break;
        case "accepted":
          statusColor.style.backgroundColor = "#5cdb5c";
          // Notify on appointment acceptance
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

// Function to fetch doctor information by ID
async function fetchDoctorInfoById(doctorId) {
  try {
    const response = await fetch(`/api/doctors?doctorId=${doctorId}`);
    const doctorInfo = await response.json();
    return doctorInfo[0]; // Assuming the API returns an array of doctors; use the first one
  } catch (error) {
    console.error("Error fetching doctor information:", error.message);
    return null;
  }
}

async function fetchPatientInfoById(patientId) {
  try {
    const response = await fetch(`/api/patients?patientId=${patientId}`);
    const patientInfo = await response.json();
    return patientInfo[0]; // Assuming the API returns an array of doctors; use the first one
  } catch (error) {
    console.error("Error fetching doctor information:", error.message);
    return null;
  }
}

// Function to fetch and render appointments
const fetchAppointments = async (status = null) => {
  try {
    const token = sessionStorage.getItem("jwt");

    const response = await fetch("/auth/appointments-info", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data; // Return the fetched data
    } else {
      console.error(
        "Error response: " + response.status + response.statusText,
        "error"
      );
      return null; // Return null if there is an error
    }
  } catch (error) {
    console.error("Unexpected error: " + error, "error");
    return null; // Return null in case of an exception
  }
};

const fetchAndRenderAppointments = async () => {
  try {
    const [doctors, patients, appointmentsData] = await Promise.all([
      fetch("/api/doctors").then((response) => response.json()),
      fetch("/api/patients").then((response) => response.json()),
      fetch("/auth/appointments-info", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
        },
      }).then((response) => response.json()),
    ]);

    if (appointmentsData.success) {
      const mergedAppointments = mergeAppointmentsData(
        appointmentsData.appointments,
        doctors,
        patients
      );

      // Render the appointments in the "appointments-container" div
      renderAppointments(mergedAppointments);
    } else {
      console.error("Error retrieving appointments:", appointmentsData.error);
    }
  } catch (error) {
    console.error("Error fetching and rendering appointments:", error.message);
  }
};

const mergeAppointmentsData = (appointments, doctors, patients) => {
  return appointments.map((appointment) => {
    const doctorInfo = doctors.find(
      (doctor) => doctor.id === appointment.doctor_id
    );
    const patientInfo = patients.find(
      (patient) => patient.id === appointment.patient_id
    );

    return {
      ...appointment,
      doctor: doctorInfo,
      patient: patientInfo,
    };
  });
};

async function fetchAndRenderPatients(searchQuery = "") {
  try {
    const activePage = document
      .querySelector(".menu-item.active")
      .getAttribute("data-page");

    if (activePage !== "patients") {
      return;
    }

    const response = await fetch("/api/patients");
    const patients = await response.json();

    console.log(patients);

    // Pass appointments to renderPatients
    renderPatients(patients, searchQuery);
  } catch (error) {
    console.log("Error fetching and rendering patients: " + error, "error");
  }
}

// Generarea cartonaselor cu pacienti
function renderPatients(patients, searchQuery = "") {
  const patientsContainer = document.querySelector(".patients-container");

  patientsContainer.innerHTML = "";

  patients.forEach((patient) => {
    if (patient.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      const patientElement = document.createElement("div");
      patientElement.classList.add("patient-container-element");

      const patientImageContainer = document.createElement("div");
      patientImageContainer.classList.add("patient-img-container");

      const patientImage = document.createElement("img");
      patientImage.src = "../UserImages/" + patient.image;
      patientImage.alt = patient.name;
      patientImageContainer.appendChild(patientImage);

      // Append the image container to the main container
      patientElement.appendChild(patientImageContainer);

      const patientName = document.createElement("h3");
      patientName.textContent = patient.name;
      patientElement.appendChild(patientName);

      const patientIdInput = document.createElement("input");
      patientIdInput.type = "hidden";
      patientIdInput.name = "patientId";
      patientIdInput.value = patient.id;
      patientElement.appendChild(patientIdInput);

      const fileButton = document.createElement("button");
      fileButton.textContent = "See Medical File";
      fileButton.addEventListener("click", () =>
        loadPage("medical-file", patient.id)
      );

      patientElement.appendChild(fileButton);

      patientsContainer.appendChild(patientElement);
    }
  });
}

async function fetchAndRenderDoctors(searchQuery = "") {
  try {
    const activePage = document
      .querySelector(".menu-item.active")
      .getAttribute("data-page");

    if (activePage !== "doctors") {
      return;
    }

    const response = await fetch("/api/doctors");
    const doctors = await response.json();

    console.log(doctors);

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

// async function openMedicalFile(patientId) {
//   const token = sessionStorage.getItem("jwt");

//   try {
//     // Fetch all patient data including medical file information
//     const response = await fetch(`/api/patients?patientId=${patientId}`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (response.ok) {
//       const patientData = await response.json();

//       // Check if patientData is an array and not empty
//       if (Array.isArray(patientData) && patientData.length > 0) {
//         const medicalFileData = patientData[0]; // Assuming medical file info is within the patient data

//         // Populate the HTML elements with medical file data
//         populateMedicalFileData(medicalFileData);
//       } else {
//         console.log(
//           "Error fetching patient information:" + patientData,
//           "error"
//         );
//       }
//     } else {
//       console.log(
//         "Error fetching patient information: " + response.statusText,
//         "error"
//       );
//     }
//   } catch (error) {
//     console.log("Unexpected error:" + error, "error");
//   }
// }

function capitalizeFirstLetter(input) {
  if (typeof input !== "string" || input.length === 0) {
    return input;
  }

  return input.charAt(0).toUpperCase() + input.slice(1);
}

// function formatName(name) {
//   const words = name.split(" ");
//   const capitalizedWords = words.map((word) => capitalizeFirstLetter(word));
//   return capitalizedWords.join(" ");
// }

// function populateMedicalFileData(data) {
//   const formattedName = data.name ? formatName(data.name) : "";
//   const formattedGender = data.gender ? capitalizeFirstLetter(data.gender) : "";
//   const formattedCity = data.city ? formatName(data.city) : "";
//   document.getElementById("patientId").value = data.id;
//   document.getElementById("name").value = formattedName;
//   document.getElementById("gender").value = formattedGender;
//   document.getElementById("city").value = formattedCity;
//   document.getElementById("phone").value = data.phone;
//   document.getElementById("email").value = data.email;
//   document.getElementById("age").value = calculateAge(data.birthday) || "";
//   document.getElementById("height").value = data.height || "";
//   document.getElementById("weight").value = data.weight || "";
//   const diagnosticsList = data.diagnostics ? data.diagnostics.split(",") : [];
//   const medicationsList = data.medications ? data.medications.split(",") : [];

//   const diagnosticsContainer = document.getElementById("diagnosticsList");
//   diagnosticsContainer.innerHTML = "";

//   diagnosticsList.forEach((diagnostic) => {
//     const diagnosticItem = document.createElement("li");
//     diagnosticItem.textContent = capitalizeFirstLetter(diagnostic);
//     diagnosticsContainer.appendChild(diagnosticItem);
//   });

//   const medicationsContainer = document.getElementById("medicationsList");
//   medicationsContainer.innerHTML = "";

//   medicationsList.forEach((medication) => {
//     const medicationItem = document.createElement("li");
//     medicationItem.textContent = capitalizeFirstLetter(medication);
//     medicationsContainer.appendChild(medicationItem);
//   });
// }

// function calculateAge(birthday) {
//   const birthDate = new Date(birthday);
//   const currentDate = new Date();
//   let age = currentDate.getFullYear() - birthDate.getFullYear();
//   if (
//     currentDate.getMonth() < birthDate.getMonth() ||
//     (currentDate.getMonth() === birthDate.getMonth() &&
//       currentDate.getDate() < birthDate.getDate())
//   ) {
//     age--;
//   }

//   return age;
// }

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
          displayPopup("Error updating profile: " + error, "error");
        }
      })
      .catch((error) => {
        displayPopup(
          "Error updating profile. Please try again." + error,
          "error"
        );
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
      displayPopup("Error saving user settings:" + data.error, "error");
    }
  } catch (error) {
    displayPopup("Error saving user settings:" + error, "error");
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
      displayPopup("Error fetching user settings:" + data.error, "error");
    }
  } catch (error) {
    displayPopup("Error fetching user settings:" + error, "error");
  }
}

// Function to update UI with user settings
function updateUIWithUserSettings(userSettings) {
  const notificationToggle = document.getElementById("notificationToggle");

  if ("receiveNotifications" in userSettings) {
    notificationToggle.checked = userSettings.receiveNotifications;
  }
}
