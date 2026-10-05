/* ============================================================
   SEÇÃO: GALERIA
   ============================================================ */
import {
    getGaleria,
    criarItemGaleria,
    atualizarItemGaleria,
    deletarItemGaleria
} from '../db.js';
import { toast, abrirModal, escapar } from '../utils.js';

let fotos = [];
let filtroAtual = 'todas';
let editandoId = null;

const CATEGORIAS = {
    operacoes: { label: 'Operações', icone: 'fa-crosshairs', cor: '#ef6c00' },
    formaturas: { label: 'Formaturas', icone: 'fa-graduation-cap', cor: '#0d47a1' },
    core: { label: 'CORE', icone: 'fa-shield-halved', cor: '#b71c1c' },
    saer: { label: 'SAER', icone: 'fa-helicopter', cor: '#a8841a' },
    gem: { label: 'GEM', icone: 'fa-motorcycle', cor: '#424242' }
};

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-galeria');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Galeria de Operações</h2>
        <p class="secao-desc">Gerencie as fotos exibidas no site público. Cole a URL da imagem (Imgur, Discord, etc.).</p>
      </div>
      <div class="secao-acoes">
        <button class="btn-acao btn-primario" id="btnNovaFoto">
          <i class="fa-solid fa-plus"></i> Nova Foto
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="galeria-filtros-edit">
      <button class="filtro-edit ativo" data-filtro="todas">
        <i class="fa-solid fa-images"></i> <span>Todas</span>
      </button>
      ${Object.entries(CATEGORIAS).map(([key, cat]) => `
        <button class="filtro-edit" data-filtro="${key}">
          <i class="fa-solid ${cat.icone}"></i> <span>${cat.label}</span>
        </button>
      `).join('')}
    </div>

    <!-- GRID -->
    <div class="galeria-grid-edit" id="galeriaGrid"></div>

    <!-- FORM -->
    <div class="aviso-form-overlay" id="galeriaFormOverlay">
      <div class="aviso-form" style="max-width: 720px;">
        <div class="aviso-form-header">
          <h3 id="galeriaFormTitulo">Nova Foto</h3>
          <button class="btn-fechar" id="btnFecharGaleriaForm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="aviso-form-body">
          <!-- Preview da imagem -->
          <div class="galeria-preview-form" id="galeriaPreview">
            <div class="galeria-preview-vazio">
              <i class="fa-solid fa-image"></i>
              <span>Cole uma URL de imagem abaixo</span>
            </div>
          </div>

          <div class="form-linha">
            <label>Título *</label>
            <input type="text" id="galeriaTitulo" placeholder="Ex: Operação Caveira" required>
          </div>

          <div class="form-linha">
            <label>Descrição</label>
            <input type="text" id="galeriaDescricao" placeholder="Ex: Combate ao tráfico em Revoada RJ">
          </div>

          <div class="form-linha-dupla">
            <div class="form-linha">
              <label>Categoria *</label>
              <select id="galeriaCategoria">
                ${Object.entries(CATEGORIAS).map(([key, cat]) => `
                  <option value="${key}">${cat.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-linha">
              <label>Ordem de Exibição</label>
              <input type="number" id="galeriaOrdem" value="0" min="0" placeholder="0">
            </div>
          </div>

          <div class="form-linha">
            <label>URL da Imagem *</label>
            <input type="text" id="galeriaUrl" placeholder="https://i.imgur.com/exemplo.jpg" required>
            <p class="editor-dica" style="margin-top: 8px;">
              <i class="fa-solid fa-lightbulb"></i>
              Suba a imagem no <strong>Imgur</strong> ou <strong>Discord</strong> e cole o link direto aqui.
            </p>
          </div>
        </div>

        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" id="btnCancelarGaleriaForm">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarGaleria">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Foto
          </button>
        </div>
      </div>
    </div>
  `;

    container.dataset.pronto = '1';

    // Eventos
    document.getElementById('btnNovaFoto').addEventListener('click', () => abrirForm());
    document.getElementById('btnFecharGaleriaForm').addEventListener('click', fecharForm);
    document.getElementById('btnCancelarGaleriaForm').addEventListener('click', fecharForm);
    document.getElementById('btnSalvarGaleria').addEventListener('click', salvar);

    // Preview em tempo real da URL
    document.getElementById('galeriaUrl').addEventListener('input', (e) => {
        atualizarPreviewForm(e.target.value.trim());
    });

    // Filtros
    document.querySelectorAll('.filtro-edit').forEach(filtro => {
        filtro.addEventListener('click', () => {
            document.querySelectorAll('.filtro-edit').forEach(f => f.classList.remove('ativo'));
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
        fotos = await getGaleria();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar galeria.', 'erro');
        fotos = [];
    }
}

function renderizar() {
    const grid = document.getElementById('galeriaGrid');
    if (!grid) return;

    // Filtra
    const filtradas = filtroAtual === 'todas'
        ? fotos
        : fotos.filter(f => f.categoria === filtroAtual);

    // Ordena por ordem
    const ordenadas = [...filtradas].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    if (ordenadas.length === 0) {
        grid.innerHTML = `
      <div class="vazio-prompt" style="grid-column: 1/-1;">
        <i class="fa-solid fa-image"></i>
        <p>Nenhuma foto cadastrada${filtroAtual !== 'todas' ? ' nesta categoria' : ''}.</p>
        <p class="sub">Clique em <strong>Nova Foto</strong> para adicionar a primeira.</p>
      </div>
    `;
        return;
    }

    grid.innerHTML = ordenadas.map(f => {
        const cat = CATEGORIAS[f.categoria] || CATEGORIAS.operacoes;
        return `
      <div class="foto-edit-card" data-id="${f.id}">
        <div class="foto-edit-imagem">
          <img src="${f.imagem_url}" alt="${escapar(f.titulo)}" onerror="this.parentElement.classList.add('erro'); this.style.display='none';">
          <span class="foto-edit-cat" style="background: ${cat.cor}22; color: ${cat.cor}; border-color: ${cat.cor}66;">
            <i class="fa-solid ${cat.icone}"></i> ${cat.label}
          </span>
          <span class="foto-edit-ordem">Ordem: ${f.ordem || 0}</span>
        </div>

        <div class="foto-edit-info">
          <h3>${escapar(f.titulo)}</h3>
          ${f.descricao ? `<p>${escapar(f.descricao)}</p>` : ''}
        </div>

        <div class="foto-edit-acoes">
          <button class="btn-icon" data-acao="editar" data-id="${f.id}" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon btn-perigo" data-acao="excluir" data-id="${f.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    }).join('');

    // Eventos
    grid.querySelectorAll('[data-acao]').forEach(btn => {
        const acao = btn.dataset.acao;
        const id = btn.dataset.id;

        btn.addEventListener('click', () => {
            if (acao === 'editar') abrirForm(id);
            if (acao === 'excluir') excluir(id);
        });
    });
}

/* ============================================================
   FORM
   ============================================================ */
function abrirForm(id = null) {
    editandoId = id;
    const titulo = document.getElementById('galeriaFormTitulo');

    if (id) {
        const f = fotos.find(x => x.id === id);
        if (!f) return;

        titulo.textContent = 'Editar Foto';
        document.getElementById('galeriaTitulo').value = f.titulo || '';
        document.getElementById('galeriaDescricao').value = f.descricao || '';
        document.getElementById('galeriaCategoria').value = f.categoria || 'operacoes';
        document.getElementById('galeriaOrdem').value = f.ordem || 0;
        document.getElementById('galeriaUrl').value = f.imagem_url || '';
        atualizarPreviewForm(f.imagem_url || '');
    } else {
        titulo.textContent = 'Nova Foto';
        document.getElementById('galeriaTitulo').value = '';
        document.getElementById('galeriaDescricao').value = '';
        document.getElementById('galeriaCategoria').value = 'operacoes';
        document.getElementById('galeriaOrdem').value = 0;
        document.getElementById('galeriaUrl').value = '';
        atualizarPreviewForm('');
    }

    document.getElementById('galeriaFormOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    setTimeout(() => document.getElementById('galeriaTitulo').focus(), 100);
}

function fecharForm() {
    document.getElementById('galeriaFormOverlay').classList.remove('open');
    document.body.style.overflow = '';
    editandoId = null;
}

function atualizarPreviewForm(url) {
    const preview = document.getElementById('galeriaPreview');
    if (!preview) return;

    if (url) {
        preview.innerHTML = `
      <img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=galeria-preview-vazio><i class=\\'fa-solid fa-triangle-exclamation\\'></i><span>Imagem inválida ou não carregou</span></div>';">
    `;
    } else {
        preview.innerHTML = `
      <div class="galeria-preview-vazio">
        <i class="fa-solid fa-image"></i>
        <span>Cole uma URL de imagem abaixo</span>
      </div>
    `;
    }
}

/* ============================================================
   SALVAR
   ============================================================ */
async function salvar() {
    const titulo = document.getElementById('galeriaTitulo').value.trim();
    const descricao = document.getElementById('galeriaDescricao').value.trim();
    const categoria = document.getElementById('galeriaCategoria').value;
    const ordem = parseInt(document.getElementById('galeriaOrdem').value) || 0;
    const imagem_url = document.getElementById('galeriaUrl').value.trim();

    if (!titulo) {
        toast('Preencha o título.', 'erro');
        return;
    }
    if (!imagem_url) {
        toast('Preencha a URL da imagem.', 'erro');
        return;
    }

    const dados = {
        titulo,
        descricao: descricao || null,
        categoria,
        ordem,
        imagem_url
    };

    const btn = document.getElementById('btnSalvarGaleria');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        if (editandoId) {
            await atualizarItemGaleria(editandoId, dados);
            toast('Foto atualizada!', 'sucesso');
        } else {
            await criarItemGaleria(dados);
            toast('Foto adicionada!', 'sucesso');
        }

        fecharForm();
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Foto';
    }
}

/* ============================================================
   EXCLUIR
   ============================================================ */
function excluir(id) {
    const f = fotos.find(x => x.id === id);
    if (!f) return;

    abrirModal({
        titulo: 'Excluir foto',
        conteudo: `<p>Tem certeza que quer excluir <strong>${escapar(f.titulo)}</strong>?</p>
               <p style="margin-top:10px; color:#ff8a80;">Essa ação não pode ser desfeita.</p>`,
        confirmar: 'Excluir',
        cancelar: 'Cancelar',
        onConfirmar: async () => {
            try {
                await deletarItemGaleria(id);
                toast('Foto excluída.', 'sucesso');
                await carregarDados();
                renderizar();
            } catch (err) {
                console.error(err);
                toast('Erro ao excluir.', 'erro');
            }
        }
    });
}