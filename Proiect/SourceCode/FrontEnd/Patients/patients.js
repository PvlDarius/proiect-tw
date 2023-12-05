const menu_toggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");

menu_toggle.addEventListener("click", () => {
  menu_toggle.classList.toggle("is-active");
  sidebar.classList.toggle("is-active");
});

const imageFolderPath = "../Images/";

function renderDoctors(doctors) {
  const doctorsContainer = document.querySelector(".doctors-container");

  doctors.forEach((doctor) => {
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

    doctorsContainer.appendChild(doctorElement);
  });
}

async function fetchAndRenderDoctors() {
  try {
    const response = await fetch("/api/doctors");
    const doctors = await response.json();
    renderDoctors(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((menuItem) => {
    const page = menuItem.getAttribute("data-page");

    // Only add click event listener for links that should load dynamically
    if (page !== "logout") {
      menuItem.addEventListener("click", async (event) => {
        event.preventDefault();
        loadPage(page);
      });
    }
  });

  const currentPath = window.location.pathname.split("/").pop();
  const defaultPage = currentPath || "home";
  setActiveLink(defaultPage);

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

async function loadPage(page) {
  try {
    const response = await fetch(`/patient/${page}`);
    const pageContent = await response.text();
    document.querySelector(".main-content").innerHTML = pageContent;

    setActiveLink(page);

    if (page === "home") {
      await fetchAndRenderDoctors();
    }
  } catch (error) {
    console.error("Error loading page:", error);
  }
}
