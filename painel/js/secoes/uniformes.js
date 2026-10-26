/* ============================================================
   SEÇÃO: UNIFORMES (Painel)
   ============================================================ */
import {
    getUniformesGrupos,
    atualizarUniformeGrupo,
    criarUniforme,
    atualizarUniforme,
    deletarUniforme
} from '../db.js';
import { toast, abrirModal, escapar } from '../utils.js';

let grupos = [];
let editandoUniformeId = null;
let grupoAtualId = null;
let editandoRegrasGrupoId = null;

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-uniformes');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    // O HTML base do painel
    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Gerenciar Uniformes</h2>
        <p class="secao-desc">Edite os uniformes de cada grupamento (Masculino, Feminino, C.A.T.) e suas regras.</p>
      </div>
    </div>

    <div id="uniformesLista"></div>

    <!-- MODAL DE UNIFORME -->
    <div class="aviso-form-overlay" id="formUniforme">
      <div class="aviso-form" style="max-width: 800px;">
        <div class="aviso-form-header">
          <h3 id="tituloFormUniforme">Novo Uniforme</h3>
          <button class="btn-fechar" onclick="document.getElementById('formUniforme').classList.remove('open')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="aviso-form-body">
          
          <div class="form-linha-dupla">
            <div class="form-linha">
              <label>Grupo *</label>
              <select id="uGrupoSelect"></select>
            </div>
            <div class="form-linha">
              <label>Ordem de Exibição</label>
              <input type="number" id="uOrdem" value="0">
            </div>
          </div>

          <!-- Preview da imagem -->
          <div class="galeria-preview-form" id="uPreview" style="aspect-ratio:16/9; margin-bottom:15px; max-height:200px;">
            <div class="galeria-preview-vazio">
              <i class="fa-solid fa-shirt"></i>
              <span>Cole a URL da imagem</span>
            </div>
          </div>

          <div class="form-linha">
            <label>Título do Uniforme *</label>
            <input type="text" id="uTitulo" placeholder="Ex: Delegado Executivo" required>
          </div>

          <div class="form-linha-dupla">
            <div class="form-linha">
              <label>Badge (etiqueta pequena)</label>
              <input type="text" id="uBadge" placeholder="Ex: Delegado Geral">
            </div>
            <div class="form-linha">
              <label>Cargo(s) Autorizado(s)</label>
              <input type="text" id="uCargos" placeholder="Ex: Delegado PCERJ · Delegado Adj.">
            </div>
          </div>

          <div class="form-linha">
            <label>Observação (opcional)</label>
            <input type="text" id="uObs" placeholder="Ex: Obrigatório o uso da máscara">
          </div>

          <div class="form-linha">
            <label>URL da Imagem *</label>
            <input type="text" id="uImg" placeholder="https://i.imgur.com/..." required>
          </div>

          <div class="form-linha" style="margin-top: 15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
              <label style="margin:0;">Códigos do Uniforme *</label>
              <button type="button" class="btn-editor btn-editor-alt" id="btnFormatarCodigos" style="padding: 4px 10px; font-size: 11px;">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Limpar/Formatar
              </button>
            </div>
            <textarea id="uCodigos" rows="4" placeholder="Cole os códigos do Discord aqui e clique em Limpar/Formatar&#10;Ex: mascara 131 0; maos 52 0; calca 297 0; ..." required></textarea>
            <p class="editor-dica" style="margin-top: 8px;">
              <i class="fa-solid fa-lightbulb"></i> O botão mágico transforma quebras de linha em uma única linha com ponto e vírgula.
            </p>
          </div>
        </div>
        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" onclick="document.getElementById('formUniforme').classList.remove('open')">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarUniforme">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Uniforme
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE REGRAS DO GRUPO -->
    <div class="aviso-form-overlay" id="formRegrasGrupo">
      <div class="aviso-form" style="max-width: 600px;">
        <div class="aviso-form-header">
          <h3 id="tituloFormRegras">Editar Regras do Grupo</h3>
          <button class="btn-fechar" onclick="document.getElementById('formRegrasGrupo').classList.remove('open')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="aviso-form-body">
          <div class="form-linha">
            <label>Regras (Uma por linha)</label>
            <textarea id="uRegrasTexto" rows="8" placeholder="Proibido óculos coloridos&#10;Relógios permitidos apenas nas cores branca e preta&#10;..."></textarea>
          </div>
        </div>
        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" onclick="document.getElementById('formRegrasGrupo').classList.remove('open')">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarRegrasGrupo">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Regras
          </button>
        </div>
      </div>
    </div>
  `;

    container.dataset.pronto = '1';

    // Eventos do Modal de Uniforme
    document.getElementById('btnSalvarUniforme').addEventListener('click', salvarUniforme);
    document.getElementById('uImg').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const preview = document.getElementById('uPreview');
        if (url) {
            preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<div class=galeria-preview-vazio><i class=\\'fa-solid fa-triangle-exclamation\\'></i><span>Imagem inválida</span></div>'">`;
        } else {
            preview.innerHTML = `<div class="galeria-preview-vazio"><i class="fa-solid fa-shirt"></i><span>Cole a URL da imagem</span></div>`;
        }
    });

    // Botão Mágico de Formatar Códigos
    document.getElementById('btnFormatarCodigos').addEventListener('click', () => {
        const textarea = document.getElementById('uCodigos');
        let texto = textarea.value.replace(/\n/g, ' '); // Tira quebras de linha
        texto = texto.replace(/\s+/g, ' '); // Tira espaços duplos
        texto = texto.replace(/;\s*/g, '; '); // Padroniza os pontos e vírgulas
        if (!texto.trim().endsWith(';')) texto = texto.trim() + ';'; // Garante o ; no final
        textarea.value = texto.trim();
        toast('Códigos formatados!', 'sucesso');
    });

    // Eventos do Modal de Regras
    document.getElementById('btnSalvarRegrasGrupo').addEventListener('click', salvarRegrasGrupo);

    await carregarDados();
    renderizar();
}

/* ============================================================
   CARREGAR / RENDERIZAR
   ============================================================ */
async function carregarDados() {
    try {
        grupos = await getUniformesGrupos();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar uniformes.', 'erro');
        grupos = [];
    }
}

function renderizar() {
    const lista = document.getElementById('uniformesLista');
    if (!lista) return;

    // Se a tabela estiver vazia, mostra aviso
    if (grupos.length === 0) {
        lista.innerHTML = `
      <div class="vazio-prompt">
        <i class="fa-solid fa-shirt"></i>
        <p>Nenhum grupo de uniforme cadastrado.</p>
        <p class="sub">Crie os grupos <strong>Masculino</strong>, <strong>Feminino</strong> e <strong>C.A.T.</strong> no banco de dados para começar.</p>
      </div>
    `;
        return;
    }

    // Ordena grupos
    const ordenados = [...grupos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    lista.innerHTML = ordenados.map(g => {
        const uniformes = (g.uniformes || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        let uniformesHtml = '';
        if (uniformes.length === 0) {
            uniformesHtml = `<p style="color:var(--texto-muted); font-size:13px; font-style:italic; padding:10px 0;">Nenhum uniforme neste grupo.</p>`;
        } else {
            uniformesHtml = '<div class="vg-viaturas-grid">'; // Reutilizando a classe de grid
            uniformes.forEach(u => {
                // Pega os primeiros 3 códigos só pra dar um preview
                const previewCodigos = u.codigos ? u.codigos.split(';').slice(0, 3).join('; ') + '...' : 'Sem códigos';

                uniformesHtml += `
          <div class="vg-viatura-card" style="height: 100%;">
            <div class="vg-viatura-img">
              <img src="${u.imagem_url}" onerror="this.style.display='none'">
            </div>
            <div class="vg-viatura-info">
              <strong>${escapar(u.titulo)}</strong>
              <span>${escapar(u.badge || '')}</span>
              <p style="font-size: 10px; color: #666; margin-top: 5px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                ${escapar(previewCodigos)}
              </p>
            </div>
            <div class="vg-viatura-acoes">
              <button class="btn-icon" onclick="window.editarUniforme('${u.id}', '${g.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon btn-perigo" onclick="window.excluirUniforme('${u.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `;
            });
            uniformesHtml += '</div>';
        }

        return `
      <div class="viatura-edit-grupo">
        <div class="viatura-edit-header">
          <div class="viatura-edit-icon"><i class="fa-solid fa-shirt"></i></div>
          <div class="viatura-edit-info">
            <h3>${escapar(g.titulo)}</h3>
            <p>${uniformes.length} uniforme(s) cadastrado(s)</p>
          </div>
          <div class="viatura-edit-acoes">
            <button class="btn-acao btn-secundario" onclick="window.adicionarUniforme('${g.id}')" style="padding:8px 15px; font-size:12px;">
              <i class="fa-solid fa-plus"></i> Uniforme
            </button>
            <button class="btn-acao btn-secundario" onclick="window.editarRegrasGrupo('${g.id}')" style="padding:8px 15px; font-size:12px; border-color:var(--azul); color:#64b5f6;">
              <i class="fa-solid fa-book"></i> Regras
            </button>
          </div>
        </div>
        ${uniformesHtml}
      </div>
    `;
    }).join('');
}

/* ============================================================
   AÇÕES DE UNIFORME
   ============================================================ */
window.adicionarUniforme = function (grupoId) {
    editandoUniformeId = null;
    grupoAtualId = grupoId;

    // Popula o select de grupos
    const select = document.getElementById('uGrupoSelect');
    select.innerHTML = grupos.map(g => `<option value="${g.id}" ${g.id === grupoId ? 'selected' : ''}>${g.titulo}</option>`).join('');

    document.getElementById('tituloFormUniforme').textContent = 'Novo Uniforme';
    document.getElementById('uTitulo').value = '';
    document.getElementById('uBadge').value = '';
    document.getElementById('uCargos').value = '';
    document.getElementById('uObs').value = '';
    document.getElementById('uImg').value = '';
    document.getElementById('uCodigos').value = '';
    document.getElementById('uOrdem').value = 0;
    document.getElementById('uPreview').innerHTML = `<div class="galeria-preview-vazio"><i class="fa-solid fa-shirt"></i><span>Cole a URL da imagem</span></div>`;

    document.getElementById('formUniforme').classList.add('open');
};

window.editarUniforme = function (id, grupoId) {
    const g = grupos.find(x => x.id === grupoId);
    const u = g.uniformes.find(x => x.id === id);
    if (!u) return;

    editandoUniformeId = id;
    grupoAtualId = grupoId;

    // Popula o select
    const select = document.getElementById('uGrupoSelect');
    select.innerHTML = grupos.map(gr => `<option value="${gr.id}" ${gr.id === grupoId ? 'selected' : ''}>${gr.titulo}</option>`).join('');

    document.getElementById('tituloFormUniforme').textContent = 'Editar Uniforme';
    document.getElementById('uTitulo').value = u.titulo;
    document.getElementById('uBadge').value = u.badge || '';
    document.getElementById('uCargos').value = u.cargos || '';
    document.getElementById('uObs').value = u.observacao || '';
    document.getElementById('uImg').value = u.imagem_url;
    document.getElementById('uCodigos').value = u.codigos || '';
    document.getElementById('uOrdem').value = u.ordem || 0;
    document.getElementById('uPreview').innerHTML = `<img src="${u.imagem_url}" onerror="this.style.display='none'">`;

    document.getElementById('formUniforme').classList.add('open');
};

window.excluirUniforme = function (id) {
    abrirModal({
        titulo: 'Excluir Uniforme',
        conteudo: '<p>Tem certeza que quer excluir este uniforme?</p>',
        confirmar: 'Excluir',
        onConfirmar: async () => {
            try {
                await deletarUniforme(id);
                toast('Uniforme excluído.', 'sucesso');
                await carregarDados();
                renderizar();
            } catch (err) {
                toast('Erro ao excluir.', 'erro');
            }
        }
    });
};

async function salvarUniforme() {
    const titulo = document.getElementById('uTitulo').value.trim();
    const imagem_url = document.getElementById('uImg').value.trim();
    const codigos = document.getElementById('uCodigos').value.trim();
    const novoGrupoId = document.getElementById('uGrupoSelect').value;

    if (!titulo) return toast('Preencha o título.', 'erro');
    if (!imagem_url) return toast('Preencha a URL da imagem.', 'erro');
    if (!codigos) return toast('Preencha os códigos do uniforme.', 'erro');

    const dados = {
        grupo_id: novoGrupoId,
        titulo,
        badge: document.getElementById('uBadge').value.trim() || null,
        cargos: document.getElementById('uCargos').value.trim() || null,
        observacao: document.getElementById('uObs').value.trim() || null,
        imagem_url,
        codigos,
        ordem: parseInt(document.getElementById('uOrdem').value) || 0
    };

    try {
        if (editandoUniformeId) {
            await atualizarUniforme(editandoUniformeId, dados);
            toast('Uniforme atualizado!', 'sucesso');
        } else {
            await criarUniforme(dados);
            toast('Uniforme adicionado!', 'sucesso');
        }
        document.getElementById('formUniforme').classList.remove('open');
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar uniforme.', 'erro');
    }
}

/* ============================================================
   AÇÕES DE REGRAS DO GRUPO
   ============================================================ */
window.editarRegrasGrupo = function (grupoId) {
    const g = grupos.find(x => x.id === grupoId);
    if (!g) return;

    editandoRegrasGrupoId = grupoId;

    document.getElementById('tituloFormRegras').textContent = `Regras: ${g.titulo}`;
    document.getElementById('uRegrasTexto').value = g.regras || '';

    document.getElementById('formRegrasGrupo').classList.add('open');
};

async function salvarRegrasGrupo() {
    if (!editandoRegrasGrupoId) return;

    const regras = document.getElementById('uRegrasTexto').value;

    try {
        await atualizarUniformeGrupo(editandoRegrasGrupoId, { regras });
        toast('Regras atualizadas!', 'sucesso');
        document.getElementById('formRegrasGrupo').classList.remove('open');
        await carregarDados();
        renderizar();
    } catch (err) {
        toast('Erro ao salvar regras.', 'erro');
    }
}