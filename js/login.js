// ===== LOGIN FAKE =====
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const loginForm = document.getElementById('loginForm');

if (loginBtn && loginModal) {
  loginBtn.addEventListener('click', () => {
    loginModal.classList.add('open');
  });
}

if (closeModal) {
  closeModal.addEventListener('click', () => {
    loginModal.classList.remove('open');
  });
}

if (loginModal) {
  loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      loginModal.classList.remove('open');
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && loginModal) {
    loginModal.classList.remove('open');
  }
});

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const userId = document.getElementById('userId').value.trim();
    const userPass = document.getElementById('userPass').value;

    const validIds = ['PC-0001', 'PC-1234', 'admin'];
    const validPass = 'revoada2025';

    const btn = loginForm.querySelector('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
    btn.disabled = true;

    setTimeout(() => {
      if (validIds.includes(userId) && userPass === validPass) {
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Acesso Liberado';
        btn.style.background = '#1b5e20';
        setTimeout(() => {
          alert(`Bem-vindo(a), ${userId}!`);
          loginModal.classList.remove('open');
          loginForm.reset();
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.disabled = false;
        }, 800);
      } else {
        btn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Credenciais inválidas';
        btn.style.background = '#b71c1c';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.disabled = false;
        }, 1800);
      }
    }, 1000);
  });
}