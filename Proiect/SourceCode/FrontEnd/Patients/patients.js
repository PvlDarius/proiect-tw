const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("is-active");
  sidebar.classList.toggle("is-active");
});

const imageFolderPath = "../Images/";

function renderDoctors(doctors, searchQuery = "") {
  const activePage = document
    .querySelector(".menu-item.active")
    .getAttribute("data-page");

  if (activePage !== "appointments") {
    return;
  }

  doctors.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

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

      doctorsContainer.appendChild(doctorElement);
    }
  });
}

async function fetchAndRenderDoctors(searchQuery = "") {
  try {
    const response = await fetch("/api/doctors");
    const doctors = await response.json();
    renderDoctors(doctors, searchQuery);
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((menuItem) => {
    const page = menuItem.getAttribute("data-page");

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

document.addEventListener("click", (event) => {
  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.querySelector(".menu-toggle");

  if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
    if (sidebar.classList.contains("is-active")) {
      sidebar.classList.remove("is-active");

      menuToggle.classList.remove("is-active", "hamburger-active");
    }
  }
});

async function loadPage(page) {
  try {
    const response = await fetch(`/patient/${page}`);
    const pageContent = await response.text();

    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.remove("is-active");
    menuToggle.classList.remove("is-active");

    document.querySelector(".main-content").innerHTML = pageContent;

    setActiveLink(page);


    if (page === "appointments") {

    if (page === "home") {

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
