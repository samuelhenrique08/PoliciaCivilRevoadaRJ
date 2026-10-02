/* ============================================================
   ROTEAMENTO ENTRE SEÇÕES
   ============================================================ */
import { temPermissao } from './auth.js';
import { toast } from './utils.js';

const secoesCarregadas = {};

export async function irPara(secao) {
    if (!temPermissao(secao)) {
        toast('Você não tem permissão para acessar esta seção.', 'erro');
        return;
    }

    document.querySelectorAll('.sidebar-nav a[data-secao]').forEach(a => {
        a.classList.toggle('ativo', a.dataset.secao === secao);
    });

    document.querySelectorAll('.painel-secao').forEach(s => {
        s.classList.toggle('ativa', s.id === `secao-${secao}`);
    });

    if (!secoesCarregadas[secao]) {
        try {
            const mod = await import(`./secoes/${secao}.js`);
            if (mod.init) await mod.init();
            secoesCarregadas[secao] = true;
        } catch (err) {
            console.warn(`Módulo da seção "${secao}" ainda não existe.`, err);
        }
    }
}

export function lerHash() {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
}

export function initRouter() {
    document.querySelectorAll('.sidebar-nav a[data-secao]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const secao = a.dataset.secao;
            window.location.hash = secao;
            irPara(secao);
        });
    });

    window.addEventListener('hashchange', () => {
        irPara(lerHash());
    });

    irPara(lerHash());
}