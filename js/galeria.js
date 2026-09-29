// ===== FILTROS =====
const filtros = document.querySelectorAll('.filtro-btn');
const itens = document.querySelectorAll('.galeria-item');

filtros.forEach(btn => {
  btn.addEventListener('click', () => {
    filtros.forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');

    const filtro = btn.dataset.filtro;

    itens.forEach(item => {
      if (filtro === 'todas' || item.dataset.cat === filtro) {
        item.style.display = 'block';
        setTimeout(() => item.style.opacity = '1', 50);
      } else {
        item.style.opacity = '0';
        setTimeout(() => item.style.display = 'none', 200);
      }
    });
  });
});

// ===== LIGHTBOX =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');

itens.forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    const titulo = item.querySelector('h4').textContent;
    const sub = item.querySelector('span').textContent;

    lightboxImg.src = img.src;
    lightboxCaption.textContent = `${titulo} — ${sub}`;
    lightbox.classList.add('open');
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('open');
  });
}

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('open');
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox) {
    lightbox.classList.remove('open');
  }
});