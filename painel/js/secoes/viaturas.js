/* ============================================================
   SEÇÃO: VIATURAS (Painel)
   ============================================================ */
import {
    getViaturasGrupos,
    criarViaturaGrupo,
    atualizarViaturaGrupo,
    deletarViaturaGrupo,
    criarViatura,
    atualizarViatura,
    deletarViatura
} from '../db.js';
import { toast, abrirModal, escapar } from '../utils.js';

let grupos = [];
let editandoGrupoId = null;
let editandoViaturaId = null;

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-viaturas');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Gerenciar Viaturas</h2>
        <p class="secao-desc">Organize as viaturas por grupos (ex: Comandos, Investigadores).</p>
      </div>
      <div class="secao-acoes">
        <button class="btn-acao btn-primario" id="btnNovoGrupoViatura">
          <i class="fa-solid fa-plus"></i> Novo Grupo
        </button>
      </div>
    </div>

    <div id="viaturasLista"></div>

    <!-- MODAL DE GRUPO -->
    <div class="aviso-form-overlay" id="formGrupoViatura">
      <div class="aviso-form" style="max-width: 500px;">
        <div class="aviso-form-header">
          <h3 id="tituloFormGrupoViatura">Novo Grupo</h3>
          <button class="btn-fechar" onclick="document.getElementById('formGrupoViatura').classList.remove('open')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="aviso-form-body">
          <div class="form-linha">
            <label>Título do Grupo *</label>
            <input type="text" id="vGrupoTitulo" placeholder="Ex: Delegados e Comandos" required>
          </div>
          <div class="form-linha-dupla">
            <div class="form-linha">
              <label>Ícone (Font Awesome)</label>
              <input type="text" id="vGrupoIcone" placeholder="fa-car" value="fa-car">
            </div>
            <div class="form-linha">
              <label>Ordem de Exibição</label>
              <input type="number" id="vGrupoOrdem" value="0">
            </div>
          </div>
          <div class="form-linha">
            <label>Observação (opcional)</label>
            <textarea id="vGrupoObs" rows="2" placeholder="Ex: Disponíveis para: Delegado, Investigador..."></textarea>
          </div>
        </div>
        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" onclick="document.getElementById('formGrupoViatura').classList.remove('open')">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarGrupoViatura">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Grupo
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE VIATURA -->
    <div class="aviso-form-overlay" id="formViatura">
      <div class="aviso-form" style="max-width: 600px;">
        <div class="aviso-form-header">
          <h3 id="tituloFormViatura">Nova Viatura</h3>
          <button class="btn-fechar" onclick="document.getElementById('formViatura').classList.remove('open')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="aviso-form-body">
          <!-- Preview -->
          <div class="galeria-preview-form" id="vViaturaPreview" style="aspect-ratio:16/9; margin-bottom:15px;">
            <div class="galeria-preview-vazio">
              <i class="fa-solid fa-car"></i>
              <span>Cole a URL da imagem</span>
            </div>
          </div>

          <div class="form-linha">
            <label>Nome da Viatura *</label>
            <input type="text" id="vViaturaNome" placeholder="Ex: Toyota Highlander" required>
          </div>
          <div class="form-linha">
            <label>Subtítulo / Cargo</label>
            <input type="text" id="vViaturaSub" placeholder="Ex: Comando Supremo">
          </div>
          <div class="form-linha">
            <label>URL da Imagem *</label>
            <input type="text" id="vViaturaImg" placeholder="https://i.imgur.com/..." required>
          </div>
          <div class="form-linha">
            <label>Ordem de Exibição</label>
            <input type="number" id="vViaturaOrdem" value="0">
          </div>
        </div>
        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" onclick="document.getElementById('formViatura').classList.remove('open')">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarViatura">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Viatura
          </button>
        </div>
      </div>
    </div>
  `;

    container.dataset.pronto = '1';

    // Eventos
    document.getElementById('btnNovoGrupoViatura').addEventListener('click', () => abrirFormGrupo());
    document.getElementById('btnSalvarGrupoViatura').addEventListener('click', salvarGrupo);
    document.getElementById('btnSalvarViatura').addEventListener('click', salvarViatura);

    // Preview da imagem
    document.getElementById('vViaturaImg').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const preview = document.getElementById('vViaturaPreview');
        if (url) {
            preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<div class=galeria-preview-vazio><i class=\\'fa-solid fa-triangle-exclamation\\'></i><span>Imagem inválida</span></div>'">`;
        } else {
            preview.innerHTML = `<div class="galeria-preview-vazio"><i class="fa-solid fa-car"></i><span>Cole a URL da imagem</span></div>`;
        }
    });

    await carregarDados();
    renderizar();
}

/* ============================================================
   CARREGAR / RENDERIZAR
   ============================================================ */
async function carregarDados() {
    try {
        grupos = await getViaturasGrupos();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar viaturas.', 'erro');
        grupos = [];
    }
}

function renderizar() {
    const lista = document.getElementById('viaturasLista');
    if (!lista) return;

    if (grupos.length === 0) {
        lista.innerHTML = `
      <div class="vazio-prompt">
        <i class="fa-solid fa-car"></i>
        <p>Nenhum grupo de viaturas cadastrado.</p>
        <p class="sub">Clique em <strong>Novo Grupo</strong> para começar.</p>
      </div>
    `;
        return;
    }

    // Ordena grupos pela ordem
    const ordenados = [...grupos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    lista.innerHTML = ordenados.map(g => {
        const viaturas = (g.viaturas || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        // Monta os cards das viaturas
        let viaturasHtml = '';
        if (viaturas.length === 0) {
            viaturasHtml = `<p style="color:var(--texto-muted); font-size:13px; font-style:italic; padding:10px 0;">Nenhuma viatura neste grupo.</p>`;
        } else {
            viaturasHtml = '<div class="vg-viaturas-grid">';
            viaturas.forEach(v => {
                viaturasHtml += `
          <div class="vg-viatura-card">
            <div class="vg-viatura-img">
              <img src="${v.imagem_url}" onerror="this.style.display='none'">
            </div>
            <div class="vg-viatura-info">
              <strong>${escapar(v.nome)}</strong>
              <span>${escapar(v.subtitulo || '')}</span>
            </div>
            <div class="vg-viatura-acoes">
              <button class="btn-icon" onclick="window.editarViatura('${v.id}', '${g.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon btn-perigo" onclick="window.excluirViatura('${v.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `;
            });
            viaturasHtml += '</div>';
        }

        return `
      <div class="viatura-edit-grupo">
        <div class="viatura-edit-header">
          <div class="viatura-edit-icon"><i class="fa-solid ${g.icone || 'fa-car'}"></i></div>
          <div class="viatura-edit-info">
            <h3>${escapar(g.titulo)}</h3>
            ${g.observacao ? `<p>${escapar(g.observacao)}</p>` : ''}
          </div>
          <div class="viatura-edit-acoes">
            <button class="btn-acao btn-secundario" onclick="window.adicionarViatura('${g.id}')" style="padding:8px 15px; font-size:12px;">
              <i class="fa-solid fa-plus"></i> Viatura
            </button>
            <button class="btn-icon" onclick="window.editarGrupoViatura('${g.id}')" title="Editar Grupo"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon btn-perigo" onclick="window.excluirGrupoViatura('${g.id}')" title="Excluir Grupo"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        ${viaturasHtml}
      </div>
    `;
    }).join('');
}

/* ============================================================
   AÇÕES DE GRUPO
   ============================================================ */
window.editarGrupoViatura = function (id) {
    const g = grupos.find(x => x.id === id);
    if (!g) return;

    editandoGrupoId = id;
    document.getElementById('tituloFormGrupoViatura').textContent = 'Editar Grupo';
    document.getElementById('vGrupoTitulo').value = g.titulo;
    document.getElementById('vGrupoIcone').value = g.icone || 'fa-car';
    document.getElementById('vGrupoOrdem').value = g.ordem || 0;
    document.getElementById('vGrupoObs').value = g.observacao || '';

    document.getElementById('formGrupoViatura').classList.add('open');
};

window.excluirGrupoViatura = function (id) {
    abrirModal({
        titulo: 'Excluir Grupo',
        conteudo: '<p>Tem certeza? Todas as viaturas deste grupo também serão excluídas.</p>',
        confirmar: 'Excluir',
        onConfirmar: async () => {
            try {
                await deletarViaturaGrupo(id);
                toast('Grupo excluído.', 'sucesso');
                await carregarDados();
                renderizar();
            } catch (err) {
                toast('Erro ao excluir.', 'erro');
            }
        }
    });
};

function abrirFormGrupo() {
    editandoGrupoId = null;
    document.getElementById('tituloFormGrupoViatura').textContent = 'Novo Grupo';
    document.getElementById('vGrupoTitulo').value = '';
    document.getElementById('vGrupoIcone').value = 'fa-car';
    document.getElementById('vGrupoOrdem').value = 0;
    document.getElementById('vGrupoObs').value = '';
    document.getElementById('formGrupoViatura').classList.add('open');
}

async function salvarGrupo() {
    const titulo = document.getElementById('vGrupoTitulo').value.trim();
    if (!titulo) return toast('Preencha o título.', 'erro');

    const dados = {
        titulo,
        icone: document.getElementById('vGrupoIcone').value.trim() || 'fa-car',
        ordem: parseInt(document.getElementById('vGrupoOrdem').value) || 0,
        observacao: document.getElementById('vGrupoObs').value.trim() || null
    };

    try {
        if (editandoGrupoId) {
            await atualizarViaturaGrupo(editandoGrupoId, dados);
            toast('Grupo atualizado!', 'sucesso');
        } else {
            await criarViaturaGrupo(dados);
            toast('Grupo criado!', 'sucesso');
        }
        document.getElementById('formGrupoViatura').classList.remove('open');
        await carregarDados();
        renderizar();
    } catch (err) {
        toast('Erro ao salvar grupo.', 'erro');
    }
}

/* ============================================================
   AÇÕES DE VIATURA
   ============================================================ */
window.adicionarViatura = function (grupoId) {
    editandoViaturaId = null;
    editandoGrupoId = grupoId; // Pra saber a qual grupo pertence

    document.getElementById('tituloFormViatura').textContent = 'Nova Viatura';
    document.getElementById('vViaturaNome').value = '';
    document.getElementById('vViaturaSub').value = '';
    document.getElementById('vViaturaImg').value = '';
    document.getElementById('vViaturaOrdem').value = 0;
    document.getElementById('vViaturaPreview').innerHTML = `<div class="galeria-preview-vazio"><i class="fa-solid fa-car"></i><span>Cole a URL da imagem</span></div>`;

    document.getElementById('formViatura').classList.add('open');
};

window.editarViatura = function (id, grupoId) {
    const g = grupos.find(x => x.id === grupoId);
    const v = g.viaturas.find(x => x.id === id);
    if (!v) return;

    editandoViaturaId = id;
    editandoGrupoId = grupoId;

    document.getElementById('tituloFormViatura').textContent = 'Editar Viatura';
    document.getElementById('vViaturaNome').value = v.nome;
    document.getElementById('vViaturaSub').value = v.subtitulo || '';
    document.getElementById('vViaturaImg').value = v.imagem_url;
    document.getElementById('vViaturaOrdem').value = v.ordem || 0;

    document.getElementById('vViaturaPreview').innerHTML = `<img src="${v.imagem_url}" onerror="this.style.display='none'">`;

    document.getElementById('formViatura').classList.add('open');
};

window.excluirViatura = function (id) {
    abrirModal({
        titulo: 'Excluir Viatura',
        conteudo: '<p>Tem certeza que quer excluir esta viatura?</p>',
        confirmar: 'Excluir',
        onConfirmar: async () => {
            try {
                await deletarViatura(id);
                toast('Viatura excluída.', 'sucesso');
                await carregarDados();
                renderizar();
            } catch (err) {
                toast('Erro ao excluir.', 'erro');
            }
        }
    });
};

async function salvarViatura() {
    const nome = document.getElementById('vViaturaNome').value.trim();
    const imagem_url = document.getElementById('vViaturaImg').value.trim();

    if (!nome) return toast('Preencha o nome.', 'erro');
    if (!imagem_url) return toast('Preencha a URL da imagem.', 'erro');

    const dados = {
        grupo_id: editandoGrupoId,
        nome,
        subtitulo: document.getElementById('vViaturaSub').value.trim() || null,
        imagem_url,
        ordem: parseInt(document.getElementById('vViaturaOrdem').value) || 0
    };

    try {
        if (editandoViaturaId) {
            await atualizarViatura(editandoViaturaId, dados);
            toast('Viatura atualizada!', 'sucesso');
        } else {
            await criarViatura(dados);
            toast('Viatura adicionada!', 'sucesso');
        }
        document.getElementById('formViatura').classList.remove('open');
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar viatura.', 'erro');
    }
}