const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav ul li a');

function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        window.scrollTo({
            top: targetSection.offsetTop,
            behavior: 'smooth'
        });
    });
});

window.addEventListener('scroll', updateActiveLink);

function animateDivsOnLoad() {
    const divs = document.querySelectorAll('.smooth');
    divs.forEach((div, index) => {
      setTimeout(() => {
        div.style.opacity = 1;
        div.style.transform = 'translateY(0)';
      }, index * 500);
    });
}

function animateDivsOnScroll() {
    const divs = document.querySelectorAll('.myDiv');
    divs.forEach((div, index) => {
      const divTop = div.getBoundingClientRect().top;
      if (divTop - window.innerHeight < 0) {
        setTimeout(() => {
          div.style.opacity = 1;
          div.style.transform = 'translateY(0)';
        }, index * 500); // Adjust the delay to control the staggered appearance
      }
    });
  }

window.addEventListener('load', animateDivsOnLoad);
window.addEventListener('scroll', animateDivsOnScroll); 
