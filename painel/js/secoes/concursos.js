/* ============================================================
   SEÇÃO: CONCURSOS
   ============================================================ */
import { getConcursos, atualizarConcurso } from '../db.js';
import { toast, escapar } from '../utils.js';

let concursos = [];
let editandoSlug = null;
let linksTemporarios = [];

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-concursos');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Concursos Internos</h2>
        <p class="secao-desc">Preencha os campos abaixo. O sistema monta o edital automaticamente.</p>
      </div>
    </div>

    <div class="concursos-lista-edit" id="concursosLista"></div>

    <!-- Form -->
    <div class="aviso-form-overlay" id="concursoFormOverlay">
      <div class="aviso-form" style="max-width: 900px;">
        <div class="aviso-form-header">
          <h3 id="concursoFormTitulo">Editar Concurso</h3>
          <button class="btn-fechar" id="btnFecharConcursoForm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="aviso-form-body">

          <div class="concurso-form-preview" id="concursoPreview"></div>

          <!-- INFORMAÇÕES BÁSICAS -->
          <div class="form-secao">
            <div class="form-secao-titulo"><i class="fa-solid fa-circle-info"></i> Informações Básicas</div>

            <div class="form-linha-tripla">
              <div class="form-linha">
                <label>Data</label>
                <input type="text" id="concursoData" placeholder="Ex: 30/09/2026">
              </div>
              <div class="form-linha">
                <label>Hora</label>
                <input type="text" id="concursoHora" placeholder="Ex: 20:00">
              </div>
              <div class="form-linha">
                <label>Status</label>
                <select id="concursoVagas">
                  <option value="abertas">🟢 Abertas</option>
                  <option value="fechadas">🔴 Fechadas</option>
                </select>
              </div>
            </div>

            <div class="form-linha">
              <label>Local</label>
              <input type="text" id="concursoLocal" placeholder="Ex: Heliporto da P.C.E.R.J.">
            </div>
          </div>

          <!-- REQUISITOS -->
          <div class="form-secao">
            <div class="form-secao-titulo"><i class="fa-solid fa-list-check"></i> Requisitos</div>
            <div class="form-linha">
              <label>Um requisito por linha</label>
              <textarea id="concursoRequisitos" rows="5" placeholder="Patente mínima Investigador 3ª Classe&#10;Concluir todos os Cursos Obrigatórios&#10;Boa conduta&#10;Bom controle emocional&#10;Não ter nenhuma Advertência"></textarea>
            </div>
          </div>

          <!-- FARDAMENTO -->
          <div class="form-secao">
            <div class="form-secao-titulo"><i class="fa-solid fa-shirt"></i> Fardamento</div>

            <div class="form-linha">
              <label><i class="fa-solid fa-person"></i> Masculino — cole os códigos do Discord</label>
              <textarea id="concursoFardMasc" rows="3" placeholder="mascara 62 0; maos 0 0; calca 313 0; mochila 150 0; sapatos 56 0; acessorios 228 0; blusa 15 0; colete 159 0; adesivo 0 0; jaqueta 836 0; chapeu 128 0; oculos 33 0;"></textarea>
            </div>

            <div class="form-linha">
              <label><i class="fa-solid fa-person-dress"></i> Feminino — cole os códigos do Discord</label>
              <textarea id="concursoFardFem" rows="3" placeholder="mascara 50 0; maos 75 0; calca 321 11; mochila 158 0; sapatos 49 0; acessorios 230 0; blusa 3 0; colete 193 0; adesivo 0 0; jaqueta 942 2; chapeu 120 0; oculos 48 0;"></textarea>
            </div>
          </div>

          <!-- AVISOS -->
          <div class="form-secao">
            <div class="form-secao-titulo"><i class="fa-solid fa-bullhorn"></i> Avisos</div>
            <div class="form-linha">
              <label>Um aviso por linha</label>
              <textarea id="concursoAvisos" rows="4" placeholder="Curso obrigatório para realizar o concurso da CORE.&#10;Todos estão liberados a pegar o Phoenix com intuito de somente treinar o percurso."></textarea>
            </div>
          </div>

          <!-- LINKS -->
          <div class="form-secao">
            <div class="form-secao-titulo"><i class="fa-solid fa-link"></i> Links (vídeos, materiais, etc.)</div>

            <div id="linksLista"></div>

            <button type="button" class="btn-add-link" id="btnAddLink">
              <i class="fa-solid fa-plus"></i> Adicionar Link
            </button>
          </div>

          <!-- ATENCIOSAMENTE -->
          <div class="form-secao">
            <div class="form-secao-titulo"><i class="fa-solid fa-signature"></i> Atenciosamente</div>
            <div class="form-linha">
              <label>Uma linha por assinatura (ex: "Comando SAER", "[CMD SAER] Scott 🦅")</label>
              <textarea id="concursoAtenciosamente" rows="5" placeholder="Comando SAER&#10;[CMD SAER] Scott 🦅&#10;[SUB CMD SAER] Carpa 🦅&#10;&#10;Administração SAER&#10;[INV ESP CORE] Henrique 🦅"></textarea>
            </div>
          </div>

        </div>

        <div class="aviso-form-footer">
          <button class="btn-acao btn-secundario" id="btnCancelarConcursoForm">Cancelar</button>
          <button class="btn-acao btn-primario" id="btnSalvarConcurso">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  `;

    container.dataset.pronto = '1';

    document.getElementById('btnFecharConcursoForm').addEventListener('click', fecharForm);
    document.getElementById('btnCancelarConcursoForm').addEventListener('click', fecharForm);
    document.getElementById('btnSalvarConcurso').addEventListener('click', salvar);
    document.getElementById('btnAddLink').addEventListener('click', () => adicionarLink());

    await carregarDados();
    renderizar();
}

/* ============================================================
   CARREGAR / RENDERIZAR
   ============================================================ */
async function carregarDados() {
    try {
        concursos = await getConcursos();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar concursos.', 'erro');
        concursos = [];
    }
}

function renderizar() {
    const lista = document.getElementById('concursosLista');
    if (!lista) return;

    if (concursos.length === 0) {
        lista.innerHTML = `
      <div class="vazio-prompt">
        <i class="fa-solid fa-file-contract"></i>
        <p>Nenhum concurso cadastrado.</p>
      </div>
    `;
        return;
    }

    lista.innerHTML = concursos.map(c => {
        const vagasOk = c.vagas_status === 'abertas';
        const corVagas = vagasOk ? '#81c784' : '#ff8a80';
        const bgVagas = vagasOk ? 'rgba(27,94,32,.15)' : 'rgba(183,28,28,.15)';
        const borderVagas = vagasOk ? '#2e7d32' : '#b71c1c';

        return `
      <div class="concurso-edit-card" data-slug="${c.slug}" style="--cor-cat: ${c.cor || '#c9a227'};">
        <div class="concurso-edit-barra"></div>

        <div class="concurso-edit-logo">
          ${c.logo_url ? `<img src="${c.logo_url}" alt="${c.nome}" onerror="this.style.display='none';">` : ''}
        </div>

        <div class="concurso-edit-conteudo">
          <div class="concurso-edit-header">
            <span class="concurso-edit-sigla">${c.sigla || c.categoria}</span>
            <span class="concurso-edit-vagas" style="background:${bgVagas}; color:${corVagas}; border-color:${borderVagas};">
              <i class="fa-solid fa-circle" style="font-size:7px;"></i> ${vagasOk ? 'Vagas Abertas' : 'Vagas Fechadas'}
            </span>
          </div>

          <h3 class="concurso-edit-titulo">${escapar(c.titulo)}</h3>

          <div class="concurso-edit-meta">
            <span><i class="fa-solid fa-calendar-day"></i> ${escapar(c.data_evento || '—')}</span>
            <span><i class="fa-solid fa-clock"></i> ${escapar(c.hora_evento || '—')}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${escapar(c.local_evento || '—')}</span>
          </div>
        </div>

        <div class="concurso-edit-acoes">
          <button class="btn-acao btn-secundario btn-editar-concurso" data-slug="${c.slug}">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
        </div>
      </div>
    `;
    }).join('');

    lista.querySelectorAll('.btn-editar-concurso').forEach(btn => {
        btn.addEventListener('click', () => abrirForm(btn.dataset.slug));
    });
}

/* ============================================================
   FORM — ABRIR / FECHAR
   ============================================================ */
function abrirForm(slug) {
    const c = concursos.find(x => x.slug === slug);
    if (!c) return;

    editandoSlug = slug;

    document.getElementById('concursoFormTitulo').textContent = `Editar: ${c.titulo}`;

    document.getElementById('concursoPreview').innerHTML = `
    ${c.logo_url ? `<img src="${c.logo_url}" alt="${c.nome}" onerror="this.style.display='none';">` : ''}
    <div>
      <strong>${c.nome}</strong>
      <span>${c.titulo}</span>
    </div>
  `;

    document.getElementById('concursoData').value = c.data_evento || '';
    document.getElementById('concursoHora').value = c.hora_evento || '';
    document.getElementById('concursoLocal').value = c.local_evento || '';
    document.getElementById('concursoVagas').value = c.vagas_status || 'abertas';
    document.getElementById('concursoRequisitos').value = c.requisitos || '';
    document.getElementById('concursoFardMasc').value = c.fardamento_masc || '';
    document.getElementById('concursoFardFem').value = c.fardamento_fem || '';
    document.getElementById('concursoAvisos').value = c.avisos || '';
    document.getElementById('concursoAtenciosamente').value = c.atenciosamente || '';

    // Links
    linksTemporarios = Array.isArray(c.links) ? [...c.links] : [];
    renderizarLinks();

    document.getElementById('concursoFormOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function fecharForm() {
    document.getElementById('concursoFormOverlay').classList.remove('open');
    document.body.style.overflow = '';
    editandoSlug = null;
    linksTemporarios = [];
}

/* ============================================================
   LINKS — Repetidor
   ============================================================ */
function renderizarLinks() {
    const lista = document.getElementById('linksLista');
    if (!lista) return;

    if (linksTemporarios.length === 0) {
        lista.innerHTML = `<p class="vazio-links">Nenhum link adicionado ainda.</p>`;
        return;
    }

    lista.innerHTML = linksTemporarios.map((link, i) => `
    <div class="link-item" data-index="${i}">
      <input type="text" data-campo="nome" value="${escapar(link.nome || '')}" placeholder="Nome do link (ex: Vídeo do Percurso)">
      <input type="text" data-campo="url" value="${escapar(link.url || '')}" placeholder="URL (ex: https://youtube.com/watch?v=...)">
      <button type="button" class="btn-remover-link" data-index="${i}" title="Remover">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');

    lista.querySelectorAll('.link-item input').forEach(input => {
        input.addEventListener('input', (e) => {
            const item = e.target.closest('.link-item');
            const index = Number(item.dataset.index);
            const campo = e.target.dataset.campo;
            linksTemporarios[index][campo] = e.target.value;
        });
    });

    lista.querySelectorAll('.btn-remover-link').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.index);
            linksTemporarios.splice(index, 1);
            renderizarLinks();
        });
    });
}

function adicionarLink() {
    linksTemporarios.push({ nome: '', url: '' });
    renderizarLinks();
}

/* ============================================================
   SALVAR — Monta o HTML automaticamente
   ============================================================ */
async function salvar() {
    if (!editandoSlug) return;

    const data = document.getElementById('concursoData').value.trim();
    const hora = document.getElementById('concursoHora').value.trim();
    const local = document.getElementById('concursoLocal').value.trim();
    const vagas = document.getElementById('concursoVagas').value;
    const requisitos = document.getElementById('concursoRequisitos').value;
    const fardMasc = document.getElementById('concursoFardMasc').value;
    const fardFem = document.getElementById('concursoFardFem').value;
    const avisos = document.getElementById('concursoAvisos').value;
    const atenciosamente = document.getElementById('concursoAtenciosamente').value;

    // Monta o HTML completo
    const html = montarHTML({
        data, hora, local,
        requisitos, fardMasc, fardFem, avisos,
        links: linksTemporarios,
        atenciosamente
    });

    const dados = {
        data_evento: data,
        hora_evento: hora,
        local_evento: local,
        vagas_status: vagas,
        requisitos,
        fardamento_masc: fardMasc,
        fardamento_fem: fardFem,
        avisos,
        links: linksTemporarios,
        atenciosamente,
        conteudo: html
    };

    const btn = document.getElementById('btnSalvarConcurso');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        await atualizarConcurso(editandoSlug, dados);
        toast('Concurso atualizado com sucesso!', 'sucesso');
        fecharForm();
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações';
    }
}

/* ============================================================
   MONTADOR DE HTML
   ============================================================ */
function montarHTML({ data, hora, local, requisitos, fardMasc, fardFem, avisos, links, atenciosamente }) {
    let html = '';

    // Informações básicas
    if (data || hora || local) {
        html += `<h4><i class="fa-solid fa-circle-info"></i> Informações</h4>`;
        html += '<ul>';
        if (data) html += `<li><strong>Data:</strong> ${escapar(data)}</li>`;
        if (hora) html += `<li><strong>Hora:</strong> ${escapar(hora)}</li>`;
        if (local) html += `<li><strong>Local:</strong> ${escapar(local)}</li>`;
        html += '</ul>';
    }

    // Requisitos
    if (requisitos.trim()) {
        html += `<h4><i class="fa-solid fa-list-check"></i> Requisitos</h4>`;
        html += '<ul>';
        requisitos.split('\n').map(l => l.trim()).filter(Boolean).forEach(linha => {
            html += `<li>${escapar(linha)}</li>`;
        });
        html += '</ul>';
    }

    // Fardamento
    if (fardMasc.trim() || fardFem.trim()) {
        html += `<h4><i class="fa-solid fa-shirt"></i> Fardamento</h4>`;

        if (fardMasc.trim()) {
            html += `<div class="fardamento-box">
        <h5>
          <span><i class="fa-solid fa-person"></i> Masculino</span>
          <button type="button" class="btn-copiar-fardamento" data-codigos="${escapar(limparCodigos(fardMasc))}">
            <i class="fa-solid fa-copy"></i> Copiar
          </button>
        </h5>
        <div class="fardamento-codigos">${gerarCodigosHTML(fardMasc)}</div>
      </div>`;
        }

        if (fardFem.trim()) {
            html += `<div class="fardamento-box">
        <h5>
          <span><i class="fa-solid fa-person-dress"></i> Feminino</span>
          <button type="button" class="btn-copiar-fardamento" data-codigos="${escapar(limparCodigos(fardFem))}">
            <i class="fa-solid fa-copy"></i> Copiar
          </button>
        </h5>
        <div class="fardamento-codigos">${gerarCodigosHTML(fardFem)}</div>
      </div>`;
        }
    }

    // Avisos
    if (avisos.trim()) {
        html += `<h4><i class="fa-solid fa-bullhorn"></i> Avisos</h4>`;
        html += '<div class="aviso-edital">';
        avisos.split('\n').map(l => l.trim()).filter(Boolean).forEach(linha => {
            html += `<p><i class="fa-solid fa-exclamation-triangle"></i> ${escapar(linha)}</p>`;
        });
        html += '</div>';
    }

    // Links
    const linksValidos = links.filter(l => l.nome && l.url);
    if (linksValidos.length > 0) {
        html += `<h4><i class="fa-solid fa-link"></i> Links Úteis</h4>`;
        linksValidos.forEach(link => {
            html += `<a href="${escapar(link.url)}" target="_blank" rel="noopener" class="edital-link">
        <i class="fa-solid fa-link"></i> ${escapar(link.nome)}
      </a>`;
        });
    }

    // Atenciosamente
    if (atenciosamente.trim()) {
        html += '<div class="edital-assinatura">';
        atenciosamente.split('\n').forEach(linha => {
            if (linha.trim()) {
                html += `<div>${escapar(linha.trim())}</div>`;
            } else {
                html += '<br>';
            }
        });
        html += '</div>';
    }

    return html;
}

/* ============================================================
   LIMPAR CÓDIGOS (formato pra copiar)
   ============================================================ */
function limparCodigos(texto) {
    // Substitui quebras de linha por espaço, junta tudo e normaliza
    return texto
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/;\s*$/, ';')
        .trim();
}

/* ============================================================
   GERAR CÓDIGOS DE FARDAMENTO
   ============================================================ */
function gerarCodigosHTML(texto) {
    const codigos = texto
        .replace(/\n/g, ' ')
        .split(';')
        .map(c => c.trim())
        .filter(Boolean);

    return codigos.map(cod => {
        const partes = cod.split(/\s+/);
        if (partes.length >= 2) {
            const chave = partes[0];
            const valor = partes.slice(1).join(' ');
            return `<span><b>${escapar(chave)}</b> ${escapar(valor)}</span>`;
        }
        return `<span>${escapar(cod)}</span>`;
    }).join('');
}