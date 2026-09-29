// ===== MENU MOBILE =====
const menuToggle = document.getElementById('menuToggle');
const nav = document.querySelector('nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const icon = menuToggle.querySelector('i');
    if (nav.classList.contains('open')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-xmark');
    } else {
      icon.classList.remove('fa-xmark');
      icon.classList.add('fa-bars');
    }
  });

  // Fecha ao clicar em um link (mobile)
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 950) {
        nav.classList.remove('open');
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });
  });
}

// ===== LINK ATIVO =====
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(link => {
  if (link.getAttribute('href') === currentPage) {
    link.classList.add('active');
  }
});

// ===== SCROLL SUAVE =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== ANIMAÇÃO SCROLL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, section, .aviso, .stat').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});