/* ============================================================
   SEÇÃO: AVISOS / MURAL
   ============================================================ */
import {
    getAvisos,
    criarAviso,
    atualizarAviso,
    deletarAviso
} from '../db.js';
import { toast, abrirModal, dataAgora, horaAgora, escapar } from '../utils.js';

let avisos = [];
let editandoId = null;

const TIPOS = {
    aviso: { label: 'Aviso', icone: 'fa-bullhorn', cor: '#c9a227' },
    noticia: { label: 'Notícia', icone: 'fa-newspaper', cor: '#1565c0' },
    pacificacao: { label: 'Pacificação', icone: 'fa-shield-halved', cor: '#b71c1c' },
    operacao: { label: 'Operação', icone: 'fa-crosshairs', cor: '#ef6c00' },
    promocao: { label: 'Promoção', icone: 'fa-medal', cor: '#2e7d32' }
};

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-avisos');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Mural de Avisos e Notícias</h2>
        <p class="secao-desc">Comunicados oficiais, operações, pacificações e notícias da corporação.</p>
      </div>
      <div class="secao-acoes">
        <button class="btn-acao btn-primario" id="btnNovoAviso">
          <i class="fa-solid fa-plus"></i> Novo Aviso
        </button>
      </div>
    </div>

    <div class="avisos-lista-edit" id="avisosLista"></div>

    <!-- Form de edição (aparece quando edita/cria) -->
    <div class="aviso-form-overlay" id="avisoFormOverlay">
      <div class="aviso-form">
        <div class="aviso-form-header">
          <h3 id="avisoFormTitulo">Novo Aviso</h3>
          <button class="btn-fechar" id="btnFecharForm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="aviso-form-body">
          <div class="form-linha-dupla">
            <div class="form-linha">
              <label>Tipo</label>
              <select id="avisoTipo">
                ${Object.entries(TIPOS).map(([k, v]) =>
        `<option value="${k}">${v.label}</option>`
    ).join('')}
              </select>
            </div>
            <div class="form-linha">
              <label>Categoria (opcional)</label>
              <input type="text" id="avisoCategoria" placeholder="Ex: Zona Norte, Geral">
            </div>
          </div>

          <div class="form-linha">
            <label>Título *</label>
            <input type="text" id="avisoTitulo" placeholder="Ex: Pacificação no Complexo do Alemão" required>
          </div>

          <div class="form-linha">
            <label>Preview (resumo que aparece no card)</label>
            <textarea id="avisoPreview" rows="3" placeholder="Resumo curto do aviso..."></textarea>
          </div>

          <div class="form-linha">
            <label>Conteúdo completo (aceita HTML)</label>
            <textarea id="avisoConteudo" rows="8" placeholder="<p>Texto completo aqui...</p>"></textarea>
          </div>

          <div class="form-linha-dupla">
            <div class="form-linha">
              <label>Autor</label>
              <input type="text" id="avisoAutor" placeholder="Ex: [DEL G.] Macedo Tenebras">
            </div>
            <div class="form-linha">
              <label>URL da Imagem (opcional)</label>
              <input type="text" id="avisoImagem" placeholder="https://i.imgur.com/exemplo.jpg">
            </div>
          </div>

          <div class="form-linha-check">
            <input type="checkbox" id="avisoDestaque">
            <label for="avisoDestaque">📌 Destacar no topo do mural</label>
          </div>
        </div>

        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" id="btnCancelarForm">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarAviso">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Aviso
          </button>
        </div>
      </div>
    </div>
  `;

    container.dataset.pronto = '1';

    // Eventos
    document.getElementById('btnNovoAviso').addEventListener('click', () => abrirForm());
    document.getElementById('btnFecharForm').addEventListener('click', fecharForm);
    document.getElementById('btnCancelarForm').addEventListener('click', fecharForm);
    document.getElementById('btnSalvarAviso').addEventListener('click', salvarAviso);

    await carregarDados();
    renderizar();
}

/* ============================================================
   CARREGAR / RENDERIZAR
   ============================================================ */
async function carregarDados() {
    try {
        avisos = await getAvisos();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar avisos.', 'erro');
        avisos = [];
    }
}

function renderizar() {
    const lista = document.getElementById('avisosLista');
    if (!lista) return;

    if (avisos.length === 0) {
        lista.innerHTML = `
      <div class="vazio-prompt">
        <i class="fa-solid fa-newspaper"></i>
        <p>Nenhum aviso cadastrado.</p>
        <p class="sub">Clique em <strong>Novo Aviso</strong> para publicar o primeiro.</p>
      </div>
    `;
        return;
    }

    // Ordenar: destaque primeiro, depois data
    const ordenados = [...avisos].sort((a, b) => {
        if (a.destaque && !b.destaque) return -1;
        if (!a.destaque && b.destaque) return 1;
        return new Date(b.criado_em) - new Date(a.criado_em);
    });

    lista.innerHTML = ordenados.map(a => {
        const tipo = TIPOS[a.tipo] || TIPOS.aviso;
        const dataObj = new Date(a.criado_em);
        const dataStr = dataObj.toLocaleDateString('pt-BR');
        const horaStr = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return `
      <div class="aviso-edit-card ${a.destaque ? 'destaque' : ''}" data-id="${a.id}">
        <div class="aviso-edit-barra" style="background: ${tipo.cor};"></div>
        <div class="aviso-edit-conteudo">
          <div class="aviso-edit-header">
            <span class="aviso-edit-tipo" style="background: ${tipo.cor}22; color: ${tipo.cor}; border-color: ${tipo.cor}66;">
              <i class="fa-solid ${tipo.icone}"></i> ${tipo.label}
            </span>
            ${a.categoria ? `<span class="aviso-edit-categoria">${escapar(a.categoria)}</span>` : ''}
            ${a.destaque ? `<span class="aviso-edit-pin"><i class="fa-solid fa-thumbtack"></i> Fixado</span>` : ''}
          </div>

          <h3 class="aviso-edit-titulo">${escapar(a.titulo)}</h3>
          <p class="aviso-edit-preview">${escapar(a.preview || '')}</p>

          <div class="aviso-edit-meta">
            <span><i class="fa-solid fa-user-shield"></i> ${escapar(a.autor || 'Autor desconhecido')}</span>
            <span><i class="fa-solid fa-clock"></i> ${dataStr} às ${horaStr}</span>
            ${a.imagem_url ? `<span><i class="fa-solid fa-image"></i> Com imagem</span>` : ''}
          </div>
        </div>

        <div class="aviso-edit-acoes">
          <button class="btn-icon" data-acao="destaque" data-id="${a.id}" title="${a.destaque ? 'Remover destaque' : 'Destacar'}">
            <i class="fa-solid fa-thumbtack"></i>
          </button>
          <button class="btn-icon" data-acao="editar" data-id="${a.id}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon btn-perigo" data-acao="excluir" data-id="${a.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    }).join('');

    // Eventos
    lista.querySelectorAll('[data-acao]').forEach(btn => {
        const acao = btn.dataset.acao;
        const id = btn.dataset.id;

        btn.addEventListener('click', () => {
            if (acao === 'editar') abrirForm(id);
            if (acao === 'excluir') excluir(id);
            if (acao === 'destaque') toggleDestaque(id);
        });
    });
}

/* ============================================================
   FORM
   ============================================================ */
function abrirForm(id = null) {
    editandoId = id;
    const overlay = document.getElementById('avisoFormOverlay');
    const titulo = document.getElementById('avisoFormTitulo');

    if (id) {
        const a = avisos.find(x => x.id === id);
        if (!a) return;

        titulo.textContent = 'Editar Aviso';
        document.getElementById('avisoTipo').value = a.tipo || 'aviso';
        document.getElementById('avisoCategoria').value = a.categoria || '';
        document.getElementById('avisoTitulo').value = a.titulo || '';
        document.getElementById('avisoPreview').value = a.preview || '';
        document.getElementById('avisoConteudo').value = a.conteudo || '';
        document.getElementById('avisoAutor').value = a.autor || '';
        document.getElementById('avisoImagem').value = a.imagem_url || '';
        document.getElementById('avisoDestaque').checked = a.destaque || false;
    } else {
        titulo.textContent = 'Novo Aviso';
        document.getElementById('avisoTipo').value = 'aviso';
        document.getElementById('avisoCategoria').value = '';
        document.getElementById('avisoTitulo').value = '';
        document.getElementById('avisoPreview').value = '';
        document.getElementById('avisoConteudo').value = '';
        document.getElementById('avisoAutor').value = '';
        document.getElementById('avisoImagem').value = '';
        document.getElementById('avisoDestaque').checked = false;
    }

    overlay.classList.add('open');
    setTimeout(() => document.getElementById('avisoTitulo').focus(), 100);
}

function fecharForm() {
    document.getElementById('avisoFormOverlay').classList.remove('open');
    editandoId = null;
}

/* ============================================================
   SALVAR
   ============================================================ */
async function salvarAviso() {
    const tipo = document.getElementById('avisoTipo').value;
    const categoria = document.getElementById('avisoCategoria').value.trim();
    const titulo = document.getElementById('avisoTitulo').value.trim();
    const preview = document.getElementById('avisoPreview').value.trim();
    const conteudo = document.getElementById('avisoConteudo').value.trim();
    const autor = document.getElementById('avisoAutor').value.trim();
    const imagem_url = document.getElementById('avisoImagem').value.trim();
    const destaque = document.getElementById('avisoDestaque').checked;

    if (!titulo) {
        toast('O título é obrigatório.', 'erro');
        return;
    }

    const dados = {
        tipo,
        categoria: categoria || null,
        titulo,
        preview: preview || null,
        conteudo: conteudo || null,
        autor: autor || null,
        imagem_url: imagem_url || null,
        destaque
    };

    const btn = document.getElementById('btnSalvarAviso');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        if (editandoId) {
            await atualizarAviso(editandoId, dados);
            toast('Aviso atualizado!', 'sucesso');
        } else {
            await criarAviso(dados);
            toast('Aviso publicado!', 'sucesso');
        }

        fecharForm();
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar aviso.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Aviso';
    }
}

/* ============================================================
   EXCLUIR
   ============================================================ */
function excluir(id) {
    const a = avisos.find(x => x.id === id);
    if (!a) return;

    abrirModal({
        titulo: 'Excluir aviso',
        conteudo: `<p>Tem certeza que quer excluir <strong>${escapar(a.titulo)}</strong>?</p>
               <p style="margin-top:10px; color:#ff8a80;">Essa ação não pode ser desfeita.</p>`,
        confirmar: 'Excluir',
        cancelar: 'Cancelar',
        onConfirmar: async () => {
            try {
                await deletarAviso(id);
                toast('Aviso excluído.', 'sucesso');
                await carregarDados();
                renderizar();
            } catch (err) {
                console.error(err);
                toast('Erro ao excluir.', 'erro');
            }
        }
    });
}

/* ============================================================
   TOGGLE DESTAQUE
   ============================================================ */
async function toggleDestaque(id) {
    const a = avisos.find(x => x.id === id);
    if (!a) return;

    try {
        await atualizarAviso(id, { destaque: !a.destaque });
        toast(a.destaque ? 'Destaque removido.' : 'Aviso destacado!', 'sucesso');
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao alterar destaque.', 'erro');
    }
}