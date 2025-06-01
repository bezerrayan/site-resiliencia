document.addEventListener('DOMContentLoaded', function() {
  const mobileMenu = document.querySelector('.mobile-menu');
  const navList = document.querySelector('.nav-list');
  const navLinks = document.querySelectorAll('.nav-list li');
  const overlay = document.querySelector('.overlay');

  function animateLinks(open) {
    navLinks.forEach((link, index) => {
      if (open) {
        link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
      } else {
        link.style.animation = '';
      }
    });
  }

  function openMenu() {
    mobileMenu.classList.add('active');
    navList.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    animateLinks(true);
  }

  function closeMenu() {
    mobileMenu.classList.remove('active');
    navList.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    animateLinks(false);
  }

  if (mobileMenu) {
    mobileMenu.addEventListener('click', function() {
      if (navList.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Fecha o menu ao redimensionar para desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  // Fecha o menu ao clicar em um link
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
});