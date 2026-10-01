/* ============================================================
   ROTEAMENTO ENTRE SEÇÕES
   ============================================================ */
import { temPermissao } from './auth.js';
import { toast } from './utils.js';

const secoesCarregadas = {};

/* -------- IR PARA SEÇÃO -------- */
export async function irPara(secao) {
  if (!temPermissao(secao)) {
    toast('Você não tem permissão para acessar esta seção.', 'erro');
    return;
  }

  // Marcar item ativo no menu
  document.querySelectorAll('.sidebar-nav a[data-secao]').forEach(a => {
    a.classList.toggle('ativo', a.dataset.secao === secao);
  });

  // Mostrar/esconder seções
  document.querySelectorAll('.painel-secao').forEach(s => {
    s.classList.toggle('ativa', s.id === `secao-${secao}`);
  });

  // Carregar módulo da seção (lazy)
  if (!secoesCarregadas[secao]) {
    try {
      const mod = await import(`./secoes/${secao}.js`);
      if (mod.init) {
        await mod.init();
      }
      secoesCarregadas[secao] = true;
    } catch (err) {
      console.warn(`Módulo da seção "${secao}" ainda não existe.`, err);
    }
  }
}

/* -------- LER HASH DA URL -------- */
export function lerHash() {
  const hash = window.location.hash.replace('#', '');
  return hash || 'dashboard';
}

/* -------- INICIALIZAR ROUTER -------- */
export function initRouter() {
  // Links do menu
  document.querySelectorAll('.sidebar-nav a[data-secao]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const secao = a.dataset.secao;
      window.location.hash = secao;
      irPara(secao);
    });
  });

  // Mudança de hash
  window.addEventListener('hashchange', () => {
    irPara(lerHash());
  });

  // Rota inicial
  irPara(lerHash());
}