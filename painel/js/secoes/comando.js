/* ============================================================
   SEÇÃO: COMANDO ATUAL
   ============================================================ */
import { getComandoAtual, salvarComandoAtual } from '../db.js';
import { toast, abrirModal, iniciais } from '../utils.js';

let comandoLista = [];

/* -------- INIT -------- */
export async function init() {
    const container = document.getElementById('secao-comando');
    if (!container) return;

    // Se já foi renderizado, não faz de novo
    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    // HTML base da seção
    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Comando Atual</h2>
        <p class="secao-desc">Comandantes no topo da hierarquia — exibidos no site público.</p>
      </div>
      <div class="secao-acoes">
        <button class="btn-acao btn-secundario" id="btnAdicionarComando">
          <i class="fa-solid fa-plus"></i> Adicionar
        </button>
        <button class="btn-acao btn-primario" id="btnSalvarComando">
          <i class="fa-solid fa-floppy-disk"></i> Salvar
        </button>
      </div>
    </div>

    <div class="comando-lista" id="comandoLista"></div>
  `;

    container.dataset.pronto = '1';

    // Eventos
    document.getElementById('btnAdicionarComando').addEventListener('click', adicionarComando);
    document.getElementById('btnSalvarComando').addEventListener('click', salvar);

    await carregarDados();
    renderizar();
}

/* -------- CARREGAR -------- */
async function carregarDados() {
    try {
        comandoLista = await getComandoAtual();

        // Se banco estiver vazio, coloca valores padrão
        if (comandoLista.length === 0) {
            comandoLista = [
                { ordem: 1, cargo: 'Secretário de Segurança Pública', nome: '', sigla: 'SSP', icone: 'fa-user-tie', foto_url: '' },
                { ordem: 2, cargo: 'Comandante Geral', nome: '', sigla: 'CMD', icone: 'fa-crown', foto_url: '' },
                { ordem: 3, cargo: 'Subcomandante Geral', nome: '', sigla: 'SUB CMD', icone: 'fa-star', foto_url: '' },
                { ordem: 4, cargo: 'Delegado PCERJ', nome: '', sigla: 'DEL G.', icone: 'fa-user-shield', foto_url: '' }
            ];
        }
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar comando atual.', 'erro');
        comandoLista = [];
    }
}

/* -------- RENDERIZAR -------- */
function renderizar() {
    const lista = document.getElementById('comandoLista');
    if (!lista) return;

    if (comandoLista.length === 0) {
        lista.innerHTML = `<p class="vazio">Nenhum comandante cadastrado.</p>`;
        return;
    }

    lista.innerHTML = comandoLista.map((c, i) => `
    <div class="comando-card" data-index="${i}">
      <div class="comando-preview">
        <div class="comando-avatar-preview ${c.foto_url ? 'com-foto' : ''}">
          ${c.foto_url
            ? `<img src="${c.foto_url}" alt="${c.nome}" onerror="this.style.display='none'; this.parentElement.classList.remove('com-foto'); this.parentElement.textContent='${iniciais(c.nome)}';">`
            : iniciais(c.nome || '??')
        }
        </div>
        <div class="comando-preview-info">
          <strong>${c.nome || 'Sem nome'}</strong>
          <span>${c.cargo || 'Sem cargo'}</span>
        </div>
      </div>

      <div class="comando-form">
        <div class="form-linha">
          <label>Cargo</label>
          <input type="text" data-campo="cargo" value="${c.cargo || ''}" placeholder="Ex: Comandante Geral">
        </div>

        <div class="form-linha">
          <label>Nome</label>
          <input type="text" data-campo="nome" value="${c.nome || ''}" placeholder="Ex: Dede Tenebras">
        </div>

        <div class="form-linha-dupla">
          <div>
            <label>Sigla</label>
            <input type="text" data-campo="sigla" value="${c.sigla || ''}" placeholder="Ex: CMD">
          </div>
          <div>
            <label>Ícone (Font Awesome)</label>
            <input type="text" data-campo="icone" value="${c.icone || 'fa-user'}" placeholder="fa-crown">
          </div>
        </div>

        <div class="form-linha">
          <label>URL da Foto</label>
          <input type="text" data-campo="foto_url" value="${c.foto_url || ''}" placeholder="https://i.imgur.com/exemplo.jpg">
        </div>

        <div class="form-acoes">
          <button class="btn-mini btn-remover" data-acao="remover">
            <i class="fa-solid fa-trash"></i> Remover
          </button>
          <div class="form-mover">
            <button class="btn-mini" data-acao="subir" ${i === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button class="btn-mini" data-acao="descer" ${i === comandoLista.length - 1 ? 'disabled' : ''}>
              <i class="fa-solid fa-arrow-down"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

    // Eventos dos inputs
    lista.querySelectorAll('input[data-campo]').forEach(input => {
        input.addEventListener('input', (e) => {
            const card = e.target.closest('.comando-card');
            const index = Number(card.dataset.index);
            const campo = e.target.dataset.campo;
            comandoLista[index][campo] = e.target.value;
            atualizarPreview(index);
        });
    });

    // Eventos dos botões
    lista.querySelectorAll('button[data-acao]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.comando-card');
            const index = Number(card.dataset.index);
            const acao = e.target.closest('button').dataset.acao;

            if (acao === 'remover') removerComando(index);
            if (acao === 'subir') moverComando(index, -1);
            if (acao === 'descer') moverComando(index, 1);
        });
    });
}

/* -------- PREVIEW (atualização parcial, sem perder foco) -------- */
function atualizarPreview(index) {
    const c = comandoLista[index];
    const card = document.querySelector(`.comando-card[data-index="${index}"]`);
    if (!card) return;

    const avatar = card.querySelector('.comando-avatar-preview');
    const info = card.querySelector('.comando-preview-info');

    info.querySelector('strong').textContent = c.nome || 'Sem nome';
    info.querySelector('span').textContent = c.cargo || 'Sem cargo';

    if (c.foto_url) {
        avatar.classList.add('com-foto');
        avatar.innerHTML = `<img src="${c.foto_url}" onerror="this.style.display='none'; this.parentElement.classList.remove('com-foto'); this.parentElement.textContent='${iniciais(c.nome || '??')}';" alt="">`;
    } else {
        avatar.classList.remove('com-foto');
        avatar.textContent = iniciais(c.nome || '??');
    }
}

/* -------- ADICIONAR -------- */
function adicionarComando() {
    comandoLista.push({
        ordem: comandoLista.length + 1,
        cargo: '',
        nome: '',
        sigla: '',
        icone: 'fa-user',
        foto_url: ''
    });
    renderizar();
}

/* -------- REMOVER -------- */
function removerComando(index) {
    abrirModal({
        titulo: 'Remover comandante',
        conteudo: `<p>Tem certeza que quer remover <strong>${comandoLista[index].nome || 'este comandante'}</strong>?</p>`,
        confirmar: 'Remover',
        cancelar: 'Cancelar',
        onConfirmar: () => {
            comandoLista.splice(index, 1);
            // Reorganizar ordem
            comandoLista.forEach((c, i) => c.ordem = i + 1);
            renderizar();
            toast('Comandante removido. Clique em Salvar para confirmar.', 'aviso');
        }
    });
}

/* -------- MOVER -------- */
function moverComando(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= comandoLista.length) return;

    const temp = comandoLista[index];
    comandoLista[index] = comandoLista[novoIndex];
    comandoLista[novoIndex] = temp;

    comandoLista.forEach((c, i) => c.ordem = i + 1);
    renderizar();
}

/* -------- SALVAR -------- */
async function salvar() {
    // Validar
    for (const c of comandoLista) {
        if (!c.cargo?.trim()) {
            toast('Preencha o cargo de todos os comandantes.', 'erro');
            return;
        }
        if (!c.nome?.trim()) {
            toast('Preencha o nome de todos os comandantes.', 'erro');
            return;
        }
    }

    const btn = document.getElementById('btnSalvarComando');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        await salvarComandoAtual(comandoLista);
        toast('Comando atual salvo com sucesso!', 'sucesso');
        await carregarDados();
        renderizar();
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar. Verifique o console.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    }
}