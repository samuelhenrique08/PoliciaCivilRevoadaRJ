/* ============================================================
   SEÇÃO: MEMORIAL
   ============================================================ */
import { getMemorial, salvarMemorial } from '../db.js';
import { toast, escapar } from '../utils.js';

let memorialData = [];

export async function init() {
    const container = document.getElementById('secao-memorial');
    if (!container) return;

    if (container.dataset.pronto === '1') {
        await carregarDados();
        renderizar();
        return;
    }

    container.innerHTML = `
    <div class="secao-header">
      <div>
        <h2>Memorial de Delegados</h2>
        <p class="secao-desc">Cole o prompt do Discord e clique em <strong>Processar</strong> para atualizar a lista de gestões.</p>
      </div>
      <div class="secao-acoes">
        <button class="btn-acao btn-secundario" id="btnLimparMemorial">
          <i class="fa-solid fa-trash"></i> Limpar Tudo
        </button>
        <button class="btn-acao btn-primario" id="btnSalvarMemorial">
          <i class="fa-solid fa-floppy-disk"></i> Salvar
        </button>
      </div>
    </div>

    <div class="prompt-area">
      <div class="prompt-header">
        <h3><i class="fa-brands fa-discord"></i> Cole o prompt do Memorial</h3>
        <button class="btn-processar" id="btnProcessarMemorial">
          <i class="fa-solid fa-play"></i> Processar Prompt
        </button>
      </div>
      <textarea id="memorialInput" class="prompt-textarea" placeholder="╔══════════════════════════════════╗&#10;║**GESTÃO FOXTROT**&#10;..."></textarea>
    </div>

    <div id="memorialLista" class="memorial-lista-edit"></div>
  `;

    container.dataset.pronto = '1';

    document.getElementById('btnProcessarMemorial').addEventListener('click', processarPrompt);
    document.getElementById('btnLimparMemorial').addEventListener('click', limparTudo);
    document.getElementById('btnSalvarMemorial').addEventListener('click', salvar);

    await carregarDados();
    renderizar();
}

async function carregarDados() {
    try {
        memorialData = await getMemorial();
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar memorial.', 'erro');
        memorialData = [];
    }
}

/* ============================================================
   PARSER DO PROMPT DO MEMORIAL
   ============================================================ */
function processarPrompt() {
    const texto = document.getElementById('memorialInput').value.trim();
    if (!texto) return toast('Cole o prompt primeiro.', 'aviso');

    const linhas = texto.split('\n').map(l => l.trim());
    const novos = [];
    let gestaoAtual = '';
    let mandatoAtual = '';

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];

        // Detecta GESTÃO (ex: **GESTÃO FOXTROT**)
        if (linha.includes('GESTÃO')) {
            gestaoAtual = linha.replace(/[║*]/g, '').trim(); // Remove barras e asteriscos
            continue;
        }

        // Detecta MANDATO (ex: f.1, g.2)
        if (/^║?\s*[a-zA-Z]\.\d+\s*$/.test(linha)) {
            mandatoAtual = linha.replace(/║/g, '').trim();

            // Agora vamos ler as próximas linhas (até achar linha vazia ou outra gestão)
            let j = i + 1;
            let count = 0;

            while (j < linhas.length && !linhas[j].includes('GESTÃO') && !/^║?\s*[a-zA-Z]\.\d+\s*$/.test(linhas[j])) {
                const linhaMembro = linhas[j];

                // Regex para achar o ID do cargo, ID do user e o (Nome - Apelido)
                // Ex: <@&1053434333014265908>: <@699025926398148649> (Henry Romanov Tenebras - Karin)
                const match = linhaMembro.match(/<@&\d+>[:\s]*<@\d+>\s*\((.*?)\)/);

                if (match) {
                    const nomeCompleto = match[1]; // "Henry Romanov Tenebras - Karin"
                    let nome = nomeCompleto;
                    let apelido = '';

                    if (nomeCompleto.includes(' - ')) {
                        const partes = nomeCompleto.split(' - ');
                        nome = partes[0].trim();
                        apelido = partes[1].trim();
                    }

                    // O primeiro ID é o Delegado, os próximos são Adjuntos
                    const cargo = count === 0 ? 'Delegado PCERJ' : 'Delegado Adj. PCERJ';

                    novos.push({
                        ordem: novos.length + 1,
                        gestao: gestaoAtual,
                        mandato: mandatoAtual,
                        delegado_nome: cargo === 'Delegado PCERJ' ? nome : '',
                        delegado_apelido: cargo === 'Delegado PCERJ' ? apelido : '',
                        delegado_cargo: cargo,
                        adjunto_nome: cargo === 'Delegado Adj. PCERJ' ? nome : '',
                        adjunto_apelido: cargo === 'Delegado Adj. PCERJ' ? apelido : '',
                        texto_original: `${nome}${apelido ? ` (${apelido})` : ''} - ${cargo}` // Pra exibição
                    });
                    count++;
                }
                j++;
            }
            i = j - 1; // Avança o loop principal
            continue;
        }
    }

    if (novos.length === 0) {
        toast('Nenhum mandato detectado. Verifique o formato.', 'erro');
        return;
    }

    memorialData = novos;
    renderizar();
    toast(`${novos.length} registros processados!`, 'sucesso');
}

/* ============================================================
   RENDERIZAR
   ============================================================ */
function renderizar() {
    const lista = document.getElementById('memorialLista');
    if (!lista) return;

    if (memorialData.length === 0) {
        lista.innerHTML = `<div class="vazio-prompt"><i class="fa-solid fa-gavel"></i><p>Nenhum dado no memorial.</p></div>`;
        return;
    }

    // Agrupar por Gestão
    const agrupado = {};
    memorialData.forEach(m => {
        if (!agrupado[m.gestao]) agrupado[m.gestao] = [];
        agrupado[m.gestao].push(m);
    });

    let html = '';
    Object.keys(agrupado).forEach(gestao => {
        html += `
      <div class="memorial-grupo-edit">
        <h4 class="memorial-grupo-titulo">${escapar(gestao)}</h4>
        <div class="memorial-mandatos-edit">
    `;

        // Agrupar mandatos dentro da gestão
        const mandatos = {};
        agrupado[gestao].forEach(m => {
            if (!mandatos[m.mandato]) mandatos[m.mandato] = [];
            mandatos[m.mandato].push(m);
        });

        Object.keys(mandatos).forEach(mandato => {
            html += `
        <div class="memorial-mandato-edit">
          <span class="memorial-mandato-num">${mandato}</span>
          <div class="memorial-membros-grid">
      `;

            mandatos[mandato].forEach(m => {
                html += `
          <div class="memorial-membro-edit">
            <i class="fa-solid fa-shield-halved"></i>
            <div>
              <strong>${escapar(m.delegado_nome || m.adjunto_nome)}</strong>
              <span>${escapar(m.delegado_cargo)} ${m.delegado_apelido || m.adjunto_apelido ? `("${m.delegado_apelido || m.adjunto_apelido}")` : ''}</span>
            </div>
          </div>
        `;
            });

            html += `</div></div>`;
        });

        html += `</div></div>`;
    });

    lista.innerHTML = html;
}

function limparTudo() {
    if (confirm('Apagar todos os dados do memorial?')) {
        memorialData = [];
        document.getElementById('memorialInput').value = '';
        renderizar();
    }
}

async function salvar() {
    if (memorialData.length === 0) return toast('Nada para salvar.', 'aviso');

    const btn = document.getElementById('btnSalvarMemorial');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        await salvarMemorial(memorialData);
        toast('Memorial salvo com sucesso!', 'sucesso');
    } catch (err) {
        console.error(err);
        toast('Erro ao salvar.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    }
}