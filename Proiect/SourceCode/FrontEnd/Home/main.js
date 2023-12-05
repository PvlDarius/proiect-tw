let menuBtn = document.querySelector("#menu-btn");
let navbar = document.querySelector(".navbar");

menuBtn.onclick = () => {
  menuBtn.classList.toggle("fa-times");
  navbar.classList.toggle("active");
};

window.onscroll = () => {
  menuBtn.classList.remove("fa-times");
  navbar.classList.remove("active");
};

document.addEventListener("DOMContentLoaded", function () {
  // Handle section links
  const sectionLinks = document.querySelectorAll(".section-link");
  sectionLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const targetSection = this.getAttribute("data-target");
      scrollToSection(targetSection);
    });
  });

  
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  }
});

const imageFolderPath = "../Images/";

async function fetchDoctors() {
  try {
    const response = await fetch("/api/doctors");
    if (!response.ok) {
      throw new Error(`Error fetching doctors: ${response.statusText}`);
    }

    const doctors = await response.json();
    return doctors;
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    return []; 
  }
}

function renderDoctors(doctors) {
  const doctorsContainer = document.querySelector(".doctors .box-container");

  if (!doctors || !Array.isArray(doctors)) {
    console.error("Invalid or empty doctors data:", doctors);
    return;
  }

  doctors.forEach((doctor) => {
    const doctorElement = document.createElement("div");
    doctorElement.classList.add("box");

    const doctorImage = document.createElement("img");
    doctorImage.src = imageFolderPath + doctor.image;
    doctorImage.alt = doctor.name;
    doctorElement.appendChild(doctorImage);

    const doctorName = document.createElement("h3");
    doctorName.textContent = doctor.name;
    doctorElement.appendChild(doctorName);

    const doctorSpecialization = document.createElement("span");
    doctorSpecialization.textContent = doctor.specialization;
    doctorElement.appendChild(doctorSpecialization);

    doctorsContainer.appendChild(doctorElement);
  });
}

async function fetchAndRenderDoctors() {
  const doctorsData = await fetchDoctors();
  renderDoctors(doctorsData);
}

document.addEventListener("DOMContentLoaded", fetchAndRenderDoctors);

async function fetchStatistics() {
  const response = await fetch("/api/statistics");
  const data = await response.json();
  return data;
}

async function updateStatistics() {
  try {
    const statistics = await fetchStatistics();

    const doctorsCounter = document.querySelector(
      ".icons-container .icons:nth-child(1) h3"
    );
    const patientsCounter = document.querySelector(
      ".icons-container .icons:nth-child(2) h3"
    );
    const hospitalsCounter = document.querySelector(
      ".icons-container .icons:nth-child(3) h3"
    );
    const diagnosticsCounter = document.querySelector(
      ".icons-container .icons:nth-child(4) h3"
    );

    if (doctorsCounter) {
      doctorsCounter.textContent = statistics.doctorsCount || "N/A";
    }

    if (patientsCounter) {
      patientsCounter.textContent = statistics.patientsCount || "N/A";
    }

    if (hospitalsCounter) {
      hospitalsCounter.textContent = statistics.hospitalsCount || "N/A";
    }

    if (diagnosticsCounter) {
      diagnosticsCounter.textContent = statistics.diagnosticsCount || "N/A";
    }
  } catch (error) {
    console.error("Error updating statistics:", error);
  }
}

document.addEventListener("DOMContentLoaded", updateStatistics);

let header = document.querySelector(".header");
// let serviceBox = document.querySelector(".services .box-container .box");
// let doctorBox = document.querySelector(".doctors .box-container .box");

let isDarkMode = false; // Variable to track the current mode

function toggleDarkMode() {
  isDarkMode = !isDarkMode; // Toggle the mode

  document.body.classList.toggle("dark-mode", isDarkMode);

  const modeIcon = document.getElementById("modeIcon");
  modeIcon.classList.toggle("fa-moon", !isDarkMode);
  modeIcon.classList.toggle("fa-sun", isDarkMode);

  header.classList.toggle("dark-mode", isDarkMode);
  // serviceBox.classList.toggle("dark-mode", isDarkMode);
  // doctorBox.classList.toggle("dark-mode", isDarkMode);

  localStorage.setItem("darkMode", isDarkMode);
}

const storedDarkMode = localStorage.getItem("darkMode");
if (storedDarkMode) {
  isDarkMode = JSON.parse(storedDarkMode);
  toggleDarkMode();
}
