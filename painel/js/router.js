/* ============================================================
   ROTEAMENTO ENTRE SEÇÕES
   ============================================================ */
import { temPermissao } from './auth.js';
import { toast } from './utils.js';

const secoesCarregadas = {};
let secaoAtual = null;

/* ============================================================
   IR PARA UMA SEÇÃO
   ============================================================ */
export async function irPara(secao) {
    // Se já está na seção, não faz nada
    if (secaoAtual === secao) return;

    // Verifica permissão
    if (!temPermissao(secao)) {
        toast('Você não tem permissão para acessar esta seção.', 'erro');
        return;
    }

    // Marca item ativo no menu
    document.querySelectorAll('.sidebar-nav a[data-secao]').forEach(a => {
        a.classList.toggle('ativo', a.dataset.secao === secao);
    });

    // Mostra/esconde seções
    document.querySelectorAll('.painel-secao').forEach(s => {
        s.classList.toggle('ativa', s.id === `secao-${secao}`);
    });

    secaoAtual = secao;

    // Carrega o módulo da seção (lazy)
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
    } else {
        // Se já foi carregado, chama init de novo pra recarregar dados
        try {
            const mod = await import(`./secoes/${secao}.js`);
            if (mod.init) {
                await mod.init();
            }
        } catch (err) {
            console.warn(`Erro ao reinicializar seção "${secao}".`, err);
        }
    }
}

/* ============================================================
   LER HASH DA URL
   ============================================================ */
export function lerHash() {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
}

/* ============================================================
   INICIALIZAR ROUTER
   ============================================================ */
export function initRouter() {
    // Event listeners dos links do menu
    document.querySelectorAll('.sidebar-nav a[data-secao]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const secao = a.dataset.secao;
            window.location.hash = secao;
            irPara(secao);
        });
    });

    // Escuta mudanças no hash
    window.addEventListener('hashchange', () => {
        irPara(lerHash());
    });

    // Rota inicial
    irPara(lerHash());
}