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

      const doctorImage = document.createElement("img");
      doctorImage.src = imageFolderPath + doctor.image;
      doctorImage.alt = doctor.name;
      doctorElement.appendChild(doctorImage);

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
    <h2>Make Appointment</h2>
    <input type="hidden" id="id" name="id" value="${doctor.id}">

    <label for="doctor">Doctor:</label>
    <input type="text" id="doctor" value="${doctor.name}" readonly><br>
    
    <label for="specialization">Specialization:</label>
    <input type="text" id="specialization" value="${doctor.specialization}" readonly><br>

    <label for="appointmentDate">Select Date:</label>
    <input type="date" id="appointmentDate" value="${currentDate}" required><br>

    <label for="appointmentTime">Select Time:</label>
    <input type="time" id="appointmentTime" value="${formattedTime}" required><br>

    <button onclick="submitAppointmentForm()">Submit</button>
    <div id="popup" class="popup">
    <div class="popup-header">
      <p id="popupHeader"></p>
      <span class="close-button" onclick="togglePopup()">&times;</span>
    </div>
    <div class="popup-content">
      <p id="popupMessage"></p>
      <div id="countdown">
        <div id="countdown-number"></div>
        <svg>
          <circle r="18" cx="20" cy="20"></circle>
        </svg>
      </div>
    </div>
  </div>
  <div id="overlay"></div>
  `;

  // Append the form to the main content container
  const mainContentContainer = document.getElementById(
    "main-content-container"
  );
  mainContentContainer.innerHTML = "";
  mainContentContainer.appendChild(appointmentForm);
}

async function submitAppointmentForm() {
  const userInfo = await fetchUserInfo("appointment-form");

  // Continue with the submission logic

  const doctorIdInput = document.getElementById("id");
  const appointmentDateInput = document.getElementById("appointmentDate");
  const appointmentTimeInput = document.getElementById("appointmentTime");

  // Validate the date to ensure it's not in the past
  const selectedDate = new Date(appointmentDateInput.value);
  const currentDate = new Date();

  if (selectedDate < currentDate) {
    displayPopup("Please select a date in the future.", "warning");
    return;
  }

  // Extract other form data as needed
  const doctorId = doctorIdInput.value;
  const userId = userInfo.id;
  const selectedDateFormatted = appointmentDateInput.value;
  const selectedTime = appointmentTimeInput.value;

  // You can now send the appointment data to the backend or perform further validation as needed

  // Example: Send data to the backend
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
