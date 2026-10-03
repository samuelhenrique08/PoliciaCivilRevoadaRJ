/* ============================================================
   SEÇÃO: MEMBROS (Hierarquia completa)
   ============================================================ */
import { getHierarquia, salvarHierarquia } from '../db.js';
import { toast, abrirModal } from '../utils.js';

let niveis = [];

/* ============================================================
   MAPA DE ÍCONES E LOGOS POR CARGO
   ============================================================ */
const CARGOS_CONFIG = {
    'Secretário de Segurança Pública': { icone: 'fa-user-tie', logo: null },
    'Comandante Geral': { icone: 'fa-crown', logo: null },
    'Subcomandante Geral': { icone: 'fa-star', logo: null },
    'Delegado PCERJ': { icone: 'fa-user-shield', logo: null },
    'Delegado Adj. PCERJ': { icone: 'fa-user-shield', logo: null },
    'Comando CORE': { icone: 'fa-crosshairs', logo: 'assets/img/concursos/core.png' },
    'Comando CGPC': { icone: 'fa-clipboard-check', logo: 'assets/img/concursos/cgpc.png' },
    'Comando SAER': { icone: 'fa-helicopter', logo: 'assets/img/concursos/saer.png' },
    'Comando GEM': { icone: 'fa-motorcycle', logo: 'assets/img/concursos/gem.png' },
    'Coordenador Civil': { icone: 'fa-diagram-project', logo: null },
    'Supervisor Geral Civil': { icone: 'fa-user-check', logo: null },
    'Comissário de Polícia': { icone: 'fa-clipboard-list', logo: null },
    'Investigador de Operações Especiais': { icone: 'fa-bullseye', logo: null },
    'Inspetor Civil': { icone: 'fa-user-police', logo: null },
    'Investigador Operacional Civil': { icone: 'fa-person-running', logo: null },
    'Escrivão Civil': { icone: 'fa-file-signature', logo: null },
    'Investigador Especial': { icone: 'fa-star', logo: null },
    'Investigador 1ª Classe': { icone: 'fa-medal', logo: null },
    'Investigador 2ª Classe': { icone: 'fa-award', logo: null },
    'Investigador 3ª Classe': { icone: 'fa-certificate', logo: null },
    'Aluno PCERJ': { icone: 'fa-graduation-cap', logo: null }
};

const CARGOS_ESPECIAIS = ['Comando CORE', 'Comando CGPC', 'Comando SAER', 'Comando GEM'];

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-membros');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Membros da Corporação</h2>
        <p class="secao-desc">Cole o prompt da hierarquia e clique em <strong>Processar</strong>.</p>
      </div>
      <div class="secao-acoes">
        <button class="btn-acao btn-secundario" id="btnLimparMembros">
          <i class="fa-solid fa-trash"></i> Limpar Tudo
        </button>
        <button class="btn-acao btn-primario" id="btnSalvarMembros">
          <i class="fa-solid fa-floppy-disk"></i> Salvar
        </button>
      </div>
    </div>

    <!-- Área do prompt -->
    <div class="prompt-area">
      <div class="prompt-header">
        <h3><i class="fa-brands fa-discord"></i> Cole o prompt da hierarquia</h3>
        <button class="btn-processar" id="btnProcessarPrompt">
          <i class="fa-solid fa-play"></i> Processar Prompt
        </button>
      </div>
      <textarea
        id="promptInput"
        class="prompt-textarea"
        placeholder="@・Comando CORE (2)&#10;:seta: @[CMD CORE] Zeus 🦅&#10;:seta: @[SUB CMD CORE] Tavares | 🦅&#10;..."
      ></textarea>
    </div>

    <!-- Preview -->
    <div class="prompt-info" id="promptInfo" style="display:none;">
      <i class="fa-solid fa-circle-info"></i>
      <span id="promptInfoTexto"></span>
    </div>

    <div class="membros-lista-edit" id="membrosLista"></div>
  `;

    container.dataset.pronto = '1';

    document.getElementById('btnProcessarPrompt').addEventListener('click', processarPrompt);
    document.getElementById('btnLimparMembros').addEventListener('click', limparTudo);
    document.getElementById('btnSalvarMembros').addEventListener('click', salvar);

    await carregarDados();
    renderizar();
}

/* ============================================================
   CARREGAR DADOS
   ============================================================ */
async function carregarDados() {
    try {
        niveis = await getHierarquia();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar membros.', 'erro');
        niveis = [];
    }
}

/* ============================================================
   PARSER DO PROMPT
   ============================================================ */
function processarPrompt() {
    const texto = document.getElementById('promptInput').value.trim();

    if (!texto) {
        toast('Cole o prompt primeiro.', 'aviso');
        return;
    }

    const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);
    const novos = [];
    let atual = null;

    for (const linha of linhas) {
        // Linha de cargo: @・Nome do Cargo (N)
        if (linha.startsWith('@・')) {
            // Se tinha um nível anterior, salva
            if (atual) novos.push(atual);

            const match = linha.match(/^@・(.+?)\s*\((\d+)\)\s*$/);
            if (!match) continue;

            const cargo = match[1].trim();
            const config = CARGOS_CONFIG[cargo] || { icone: 'fa-user', logo: null };
            const especial = CARGOS_ESPECIAIS.includes(cargo);

            atual = {
                ordem: novos.length + 1,
                cargo: cargo,
                icone: config.icone,
                tipo_visual: config.logo ? 'logo' : 'icone',
                logo_url: config.logo,
                comando_especial: especial,
                membros: []
            };
            continue;
        }

        // Linha de membro: :seta: @[SIGLA] Nome | ID_OU_EMOJI
        if (linha.startsWith(':seta:') && atual) {
            // Ignorar "Nenhum membro."
            if (linha.includes('Nenhum membro')) continue;

            // Remove :seta: e pega o resto
            const conteudo = linha.replace(/^:seta:\s*/, '').trim();

            // Formato: @[SIGLA] Nome | ID  OU  @[SIGLA] Nome 🦅
            const match = conteudo.match(/^@!?\[(.+?)\]\s*(.+)$/);
            if (!match) continue;

            const sigla = match[1].trim();
            let resto = match[2].trim();

            // Separa nome e id (por | se existir)
            let nome = resto;
            let id = '';

            if (resto.includes('|')) {
                const partes = resto.split('|').map(p => p.trim());
                nome = partes[0];
                id = partes[1] || '';
            }

            // Remove emojis do nome (🦅, etc.) - remove tudo que não é letra/número/espaço/acento
            nome = nome.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

            // Detecta se id é emoji (🦅) - nesse caso, guarda como "🦅"
            if (id && /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu.test(id)) {
                id = '🦅';
            }

            // Monta id final
            let idFinal = '';
            if (id === '🦅') {
                idFinal = `[${sigla}]`;
            } else if (id) {
                idFinal = `[${sigla}] ${id}`;
            } else {
                idFinal = `[${sigla}]`;
            }

            atual.membros.push({ nome, id: idFinal });
        }
    }

    // Salva último nível
    if (atual) novos.push(atual);

    if (novos.length === 0) {
        toast('Nenhum cargo detectado. Verifique o formato do prompt.', 'erro');
        return;
    }

    // Atualiza ordem
    niveis = novos.map((n, i) => ({ ...n, ordem: i + 1 }));

    // Mostra info
    const totalMembros = niveis.reduce((acc, n) => acc + n.membros.length, 0);
    const info = document.getElementById('promptInfo');
    info.style.display = 'flex';
    document.getElementById('promptInfoTexto').innerHTML =
        `<strong>${niveis.length}</strong> cargos detectados · <strong>${totalMembros}</strong> membros no total`;

    renderizar();
    toast('Prompt processado com sucesso!', 'sucesso');
}

/* ============================================================
   RENDERIZAR
   ============================================================ */
function renderizar() {
    const lista = document.getElementById('membrosLista');
    if (!lista) return;

    if (niveis.length === 0) {
        lista.innerHTML = `
      <div class="vazio-prompt">
        <i class="fa-solid fa-inbox"></i>
        <p>Nenhum cargo cadastrado ainda.</p>
        <p class="sub">Cole o prompt acima e clique em <strong>Processar</strong>.</p>
      </div>
    `;
        return;
    }

    lista.innerHTML = niveis.map((n, i) => {
        const total = n.membros.length;
        const tipoVisual = n.tipo_visual || 'icone';

        // Cabeçalho do nível (logo ou ícone)
        let iconeHTML = '';
        if (tipoVisual === 'logo' && n.logo_url) {
            iconeHTML = `<img src="${n.logo_url}" alt="${n.cargo}" class="nivel-logo">`;
        } else {
            iconeHTML = `<i class="fa-solid ${n.icone || 'fa-user'}"></i>`;
        }

        const badgeEspecial = n.comando_especial
            ? '<span class="badge-especial">Comando Especial</span>'
            : '';

        let membrosHTML = '';
        if (total === 0) {
            membrosHTML = `<p class="vazio">Nenhum membro.</p>`;
        } else {
            membrosHTML = '<div class="membros-grid-edit">';
            n.membros.forEach((m, j) => {
                membrosHTML += `
          <div class="membro-edit">
            <span class="membro-nome">${m.nome}</span>
            <span class="membro-id-tag">${m.id}</span>
          </div>
        `;
            });
            membrosHTML += '</div>';
        }

        return `
      <div class="nivel-edit" data-index="${i}">
        <div class="nivel-edit-header">
          <div class="nivel-edit-icon">${iconeHTML}</div>
          <div class="nivel-edit-info">
            <h3>${n.cargo}</h3>
            <span class="nivel-count-badge">
              ${total} ${total === 1 ? 'membro' : 'membros'}
            </span>
            ${badgeEspecial}
          </div>
          <div class="nivel-edit-acoes">
            <button class="btn-icon" data-acao="toggle-visual" data-index="${i}" title="Alternar logo/ícone">
              <i class="fa-solid fa-repeat"></i>
            </button>
            <button class="btn-icon" data-acao="editar-icone" data-index="${i}" title="Trocar ícone/logo">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </div>
        ${membrosHTML}
      </div>
    `;
    }).join('');

    // Eventos
    lista.querySelectorAll('[data-acao="toggle-visual"]').forEach(btn => {
        btn.addEventListener('click', () => toggleVisual(Number(btn.dataset.index)));
    });

    lista.querySelectorAll('[data-acao="editar-icone"]').forEach(btn => {
        btn.addEventListener('click', () => editarIcone(Number(btn.dataset.index)));
    });
}

/* ============================================================
   TOGGLE VISUAL (logo ↔ ícone)
   ============================================================ */
function toggleVisual(index) {
    const nivel = niveis[index];
    if (!nivel) return;

    nivel.tipo_visual = nivel.tipo_visual === 'logo' ? 'icone' : 'logo';

    // Se virar logo mas não tiver logo_url, tenta usar o padrão
    if (nivel.tipo_visual === 'logo' && !nivel.logo_url) {
        const config = CARGOS_CONFIG[nivel.cargo];
        if (config?.logo) {
            nivel.logo_url = config.logo;
        } else {
            toast('Este cargo não tem logo disponível.', 'aviso');
            nivel.tipo_visual = 'icone';
        }
    }

    renderizar();
}

/* ============================================================
   EDITAR ÍCONE / LOGO
   ============================================================ */
function editarIcone(index) {
    const nivel = niveis[index];
    if (!nivel) return;

    const conteudo = `
    <p style="margin-bottom:15px;">Cargo: <strong>${nivel.cargo}</strong></p>
    <label style="display:block; color:var(--dourado); font-size:12px; margin-bottom:6px;">Ícone Font Awesome</label>
    <input type="text" id="inputIcone" value="${nivel.icone || 'fa-user'}" 
      style="width:100%; padding:10px; background:var(--preto); border:1px solid var(--borda); color:var(--texto); border-radius:6px; margin-bottom:15px;">
    <p style="font-size:12px; color:var(--texto-muted);">Ex: <code>fa-user</code>, <code>fa-crown</code>, <code>fa-star</code></p>
  `;

    abrirModal({
        titulo: 'Editar ícone',
        conteudo,
        confirmar: 'Salvar',
        cancelar: 'Cancelar',
        onConfirmar: () => {
            const novoIcone = document.getElementById('inputIcone').value.trim();
            if (novoIcone) {
                nivel.icone = novoIcone;
                nivel.tipo_visual = 'icone';
                renderizar();
                toast('Ícone atualizado.', 'sucesso');
            }
        }
    });
}

/* ============================================================
   LIMPAR TUDO
   ============================================================ */
function limparTudo() {
    abrirModal({
        titulo: 'Limpar tudo',
        conteudo: '<p>Tem certeza que quer <strong>apagar TODOS os cargos e membros</strong>?</p><p style="margin-top:10px; color:#ff8a80;">Essa ação não pode ser desfeita.</p>',
        confirmar: 'Apagar tudo',
        cancelar: 'Cancelar',
        onConfirmar: () => {
            niveis = [];
            document.getElementById('promptInput').value = '';
            document.getElementById('promptInfo').style.display = 'none';
            renderizar();
            toast('Tudo limpo. Cole um novo prompt.', 'aviso');
        }
    });
}

/* ============================================================
   SALVAR
   ============================================================ */
async function salvar() {
    if (niveis.length === 0) {
        toast('Nada para salvar. Cole e processe um prompt primeiro.', 'aviso');
        return;
    }

    const btn = document.getElementById('btnSalvarMembros');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        await salvarHierarquia(niveis);
        toast('Membros salvos com sucesso!', 'sucesso');
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar. Verifique o console.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    }
}