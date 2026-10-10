/* ============================================================
   SEÇÃO: TUTORIAIS
   ============================================================ */
import {
    getTutoriais,
    criarTutorial,
    atualizarTutorial,
    deletarTutorial
} from '../db.js';
import { toast, abrirModal, escapar } from '../utils.js';

let tutoriais = [];
let filtroAtual = 'todas';
let editandoId = null;

/* ============================================================
   CATEGORIAS (fáceis de adicionar novas aqui)
   ============================================================ */
const CATEGORIAS = {
    iniciante: { label: 'Iniciante', icone: 'fa-seedling', cor: '#4caf50' },
    comandos: { label: 'Comandos do Jogo', icone: 'fa-keyboard', cor: '#2196f3' },
    procedimentos: { label: 'Procedimentos', icone: 'fa-list-check', cor: '#ff9800' },
    abordagem: { label: 'Abordagem', icone: 'fa-hand', cor: '#9c27b0' },
    direcao: { label: 'Direção e Viaturas', icone: 'fa-car', cor: '#f44336' }
};

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-tutoriais');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Tutoriais</h2>
        <p class="secao-desc">Gerencie os vídeos de tutorial exibidos no site público. Os vídeos ficam hospedados no YouTube.</p>
      </div>
      <div class="secao-acoes">
        <button class="btn-acao btn-primario" id="btnNovoTutorial">
          <i class="fa-solid fa-plus"></i> Novo Tutorial
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="galeria-filtros-edit">
      <button class="filtro-edit ativo" data-filtro="todas">
        <i class="fa-solid fa-list"></i> <span>Todos</span>
      </button>
      ${Object.entries(CATEGORIAS).map(([key, cat]) => `
        <button class="filtro-edit" data-filtro="${key}">
          <i class="fa-solid ${cat.icone}"></i> <span>${cat.label}</span>
        </button>
      `).join('')}
    </div>

    <!-- GRID -->
    <div class="tutoriais-grid-edit" id="tutoriaisGrid"></div>

    <!-- FORM -->
    <div class="aviso-form-overlay" id="tutorialFormOverlay">
      <div class="aviso-form" style="max-width: 720px;">
        <div class="aviso-form-header">
          <h3 id="tutorialFormTitulo">Novo Tutorial</h3>
          <button class="btn-fechar" id="btnFecharTutorialForm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="aviso-form-body">

          <!-- Preview do vídeo -->
          <div class="tutorial-preview-form" id="tutorialPreview">
            <div class="tutorial-preview-vazio">
              <i class="fa-brands fa-youtube"></i>
              <span>Cole a URL do YouTube abaixo</span>
            </div>
          </div>

          <div class="form-linha">
            <label>Título *</label>
            <input type="text" id="tutorialTitulo" placeholder="Ex: Como fazer bind de teclas" required>
          </div>

          <div class="form-linha">
            <label>Descrição</label>
            <textarea id="tutorialDescricao" rows="3" placeholder="Breve descrição do que o vídeo ensina..."></textarea>
          </div>

          <div class="form-linha-dupla">
            <div class="form-linha">
              <label>Categoria *</label>
              <select id="tutorialCategoria">
                ${Object.entries(CATEGORIAS).map(([key, cat]) => `
                  <option value="${key}">${cat.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-linha">
              <label>Ordem de Exibição</label>
              <input type="number" id="tutorialOrdem" value="0" min="0" placeholder="0">
            </div>
          </div>

          <div class="form-linha">
            <label>URL do Vídeo no YouTube *</label>
            <input type="text" id="tutorialUrl" placeholder="https://www.youtube.com/watch?v=..." required>
            <p class="editor-dica" style="margin-top: 8px;">
              <i class="fa-solid fa-lightbulb"></i>
              Aceita qualquer formato: <strong>youtube.com/watch?v=</strong>, <strong>youtu.be/</strong>, <strong>shorts/</strong> ou <strong>embed/</strong>
            </p>
          </div>
        </div>

        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" id="btnCancelarTutorialForm">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarTutorial">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Tutorial
          </button>
        </div>
      </div>
    </div>
  `;

    container.dataset.pronto = '1';

    // Eventos
    document.getElementById('btnNovoTutorial').addEventListener('click', () => abrirForm());
    document.getElementById('btnFecharTutorialForm').addEventListener('click', fecharForm);
    document.getElementById('btnCancelarTutorialForm').addEventListener('click', fecharForm);
    document.getElementById('btnSalvarTutorial').addEventListener('click', salvar);

    // Preview em tempo real da URL
    document.getElementById('tutorialUrl').addEventListener('input', (e) => {
        atualizarPreviewForm(e.target.value.trim());
    });

    // Filtros
    document.querySelectorAll('#secao-tutoriais .filtro-edit').forEach(filtro => {
        filtro.addEventListener('click', () => {
            document.querySelectorAll('#secao-tutoriais .filtro-edit').forEach(f => f.classList.remove('ativo'));
            filtro.classList.add('ativo');
            filtroAtual = filtro.dataset.filtro;
            renderizar();
        });
    });

    await carregarDados();
    renderizar();
}

/* ============================================================
   CARREGAR / RENDERIZAR
   ============================================================ */
async function carregarDados() {
    try {
        tutoriais = await getTutoriais();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar tutoriais.', 'erro');
        tutoriais = [];
    }
}

function renderizar() {
    const grid = document.getElementById('tutoriaisGrid');
    if (!grid) return;

    const filtrados = filtroAtual === 'todas'
        ? tutoriais
        : tutoriais.filter(t => t.categoria === filtroAtual);

    const ordenados = [...filtrados].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    if (ordenados.length === 0) {
        grid.innerHTML = `
      <div class="vazio-prompt" style="grid-column: 1/-1;">
        <i class="fa-brands fa-youtube"></i>
        <p>Nenhum tutorial cadastrado${filtroAtual !== 'todas' ? ' nesta categoria' : ''}.</p>
        <p class="sub">Clique em <strong>Novo Tutorial</strong> para adicionar o primeiro.</p>
      </div>
    `;
        return;
    }

    grid.innerHTML = ordenados.map(t => {
        const cat = CATEGORIAS[t.categoria] || { label: t.categoria, icone: 'fa-video', cor: '#c9a227' };
        const thumb = `https://img.youtube.com/vi/${t.video_id}/mqdefault.jpg`;

        return `
      <div class="tutorial-edit-card" data-id="${t.id}">
        <div class="tutorial-edit-thumb">
          <img src="${thumb}" alt="${escapar(t.titulo)}">
          <span class="tutorial-edit-play"><i class="fa-solid fa-play"></i></span>
          <span class="tutorial-edit-cat" style="background: ${cat.cor}22; color: ${cat.cor}; border-color: ${cat.cor}66;">
            <i class="fa-solid ${cat.icone}"></i> ${cat.label}
          </span>
          <span class="tutorial-edit-ordem">Ordem: ${t.ordem || 0}</span>
        </div>

        <div class="tutorial-edit-info">
          <h3>${escapar(t.titulo)}</h3>
          ${t.descricao ? `<p>${escapar(t.descricao)}</p>` : ''}
        </div>

        <div class="tutorial-edit-acoes">
          <a href="${t.video_url}" target="_blank" class="btn-icon" title="Ver no YouTube">
            <i class="fa-solid fa-up-right-from-square"></i>
          </a>
          <button class="btn-icon" data-acao="editar" data-id="${t.id}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon btn-perigo" data-acao="excluir" data-id="${t.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    }).join('');

    // Eventos
    grid.querySelectorAll('[data-acao]').forEach(btn => {
        btn.addEventListener('click', () => {
            const acao = btn.dataset.acao;
            const id = btn.dataset.id;
            if (acao === 'editar') abrirForm(id);
            if (acao === 'excluir') excluir(id);
        });
    });
}

/* ============================================================
   PARSER DE URL DO YOUTUBE
   ============================================================ */
function extrairVideoId(url) {
    if (!url) return null;

    // Remove espaços
    url = url.trim();

    // Regex que pega o ID em todos os formatos
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);

    return match ? match[1] : null;
}

/* ============================================================
   FORM
   ============================================================ */
function abrirForm(id = null) {
    editandoId = id;
    const titulo = document.getElementById('tutorialFormTitulo');

    if (id) {
        const t = tutoriais.find(x => x.id === id);
        if (!t) return;

        titulo.textContent = 'Editar Tutorial';
        document.getElementById('tutorialTitulo').value = t.titulo || '';
        document.getElementById('tutorialDescricao').value = t.descricao || '';
        document.getElementById('tutorialCategoria').value = t.categoria || 'iniciante';
        document.getElementById('tutorialOrdem').value = t.ordem || 0;
        document.getElementById('tutorialUrl').value = t.video_url || '';
        atualizarPreviewForm(t.video_url || '');
    } else {
        titulo.textContent = 'Novo Tutorial';
        document.getElementById('tutorialTitulo').value = '';
        document.getElementById('tutorialDescricao').value = '';
        document.getElementById('tutorialCategoria').value = 'iniciante';
        document.getElementById('tutorialOrdem').value = 0;
        document.getElementById('tutorialUrl').value = '';
        atualizarPreviewForm('');
    }

    document.getElementById('tutorialFormOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    setTimeout(() => document.getElementById('tutorialTitulo').focus(), 100);
}

function fecharForm() {
    document.getElementById('tutorialFormOverlay').classList.remove('open');
    document.body.style.overflow = '';
    editandoId = null;
}

function atualizarPreviewForm(url) {
    const preview = document.getElementById('tutorialPreview');
    if (!preview) return;

    const videoId = extrairVideoId(url);

    if (videoId) {
        preview.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" 
        allowfullscreen>
      </iframe>
    `;
    } else if (url) {
        preview.innerHTML = `
      <div class="tutorial-preview-vazio">
        <i class="fa-solid fa-triangle-exclamation" style="color: #ff8a80;"></i>
        <span>URL inválida. Cole um link do YouTube.</span>
      </div>
    `;
    } else {
        preview.innerHTML = `
      <div class="tutorial-preview-vazio">
        <i class="fa-brands fa-youtube"></i>
        <span>Cole a URL do YouTube abaixo</span>
      </div>
    `;
    }
}

/* ============================================================
   SALVAR
   ============================================================ */
async function salvar() {
    const titulo = document.getElementById('tutorialTitulo').value.trim();
    const descricao = document.getElementById('tutorialDescricao').value.trim();
    const categoria = document.getElementById('tutorialCategoria').value;
    const ordem = parseInt(document.getElementById('tutorialOrdem').value) || 0;
    const video_url = document.getElementById('tutorialUrl').value.trim();

    if (!titulo) {
        toast('Preencha o título.', 'erro');
        return;
    }
    if (!video_url) {
        toast('Cole a URL do vídeo.', 'erro');
        return;
    }

    const video_id = extrairVideoId(video_url);
    if (!video_id) {
        toast('URL do YouTube inválida. Verifique o link.', 'erro');
        return;
    }

    const dados = {
        titulo,
        descricao: descricao || null,
        categoria,
        ordem,
        video_id,
        video_url
    };

    const btn = document.getElementById('btnSalvarTutorial');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        if (editandoId) {
            await atualizarTutorial(editandoId, dados);
            toast('Tutorial atualizado!', 'sucesso');
        } else {
            await criarTutorial(dados);
            toast('Tutorial adicionado!', 'sucesso');
        }

        fecharForm();
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Tutorial';
    }
}

/* ============================================================
   EXCLUIR
   ============================================================ */
function excluir(id) {
    const t = tutoriais.find(x => x.id === id);
    if (!t) return;

    abrirModal({
        titulo: 'Excluir tutorial',
        conteudo: `<p>Tem certeza que quer excluir <strong>${escapar(t.titulo)}</strong>?</p>
               <p style="margin-top:10px; color:#ff8a80;">Essa ação não pode ser desfeita.</p>`,
        confirmar: 'Excluir',
        cancelar: 'Cancelar',
        onConfirmar: async () => {
            try {
                await deletarTutorial(id);
                toast('Tutorial excluído.', 'sucesso');
                await carregarDados();
                renderizar();
            } catch (err) {
                console.error(err);
                toast('Erro ao excluir.', 'erro');
            }
        }
    });
}