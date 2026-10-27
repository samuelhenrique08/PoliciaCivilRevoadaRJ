/* ============================================================
   SEÇÃO: DASHBOARD
   ============================================================ */
import { getEstatisticas, registrarAcesso, getUltimoAcesso } from '../db.js';
import { getUsuario } from '../auth.js';
import { escapar } from '../utils.js';

let jaRegistrouAcesso = false;

/* ============================================================
   INIT
   ============================================================ */
export async function init() {
    const container = document.getElementById('secao-dashboard');
    if (!container) return;

    // Registra o acesso (só na primeira vez que abre o painel)
    const usuario = getUsuario();
    if (!jaRegistrouAcesso && usuario?.uid) {
        await registrarAcesso(usuario.uid);
        jaRegistrouAcesso = true;
    }

    // Sempre recarrega os dados
    await renderizar(container, usuario);
}

/* ============================================================
   RENDERIZAR
   ============================================================ */
async function renderizar(container, usuario) {
    // Loading
    container.innerHTML = `
    <div style="text-align:center; padding:80px 20px;">
      <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--dourado)"></i>
      <p style="margin-top:15px; color:var(--texto-muted);">Carregando painel...</p>
    </div>
  `;

    const stats = await getEstatisticas();
    const ultimoAcesso = usuario?.uid ? await getUltimoAcesso(usuario.uid) : null;

    // Busca a foto do comandante atual que bate com o nome do usuário logado
    let fotoDelegado = null;
    try {
        const { getComandoAtual } = await import('../db.js');
        const comando = await getComandoAtual();
        const meuCargo = comando.find(c =>
            c.nome.toLowerCase().includes(usuario.nome.toLowerCase()) ||
            usuario.nome.toLowerCase().includes(c.nome.toLowerCase())
        );
        if (meuCargo && meuCargo.foto_url) {
            fotoDelegado = meuCargo.foto_url;
        }
    } catch (err) {
        console.warn('Não foi possível buscar a foto do delegado:', err);
    }

    const formatarData = (iso) => {
        if (!iso) return 'Primeiro acesso';
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

    // Função para pegar as iniciais (fallback se não tiver foto)
    const iniciais = (nome) => {
        if (!nome) return '??';
        const partes = nome.trim().split(' ').filter(Boolean);
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    };

    // Contadores
    const cards = [
        { icone: 'fa-newspaper', cor: '#c9a227', label: 'Avisos Publicados', valor: stats.avisos, secao: 'avisos' },
        { icone: 'fa-file-contract', cor: '#4caf50', label: 'Concursos Abertos', valor: stats.concursosAbertos, secao: 'concursos' },
        { icone: 'fa-images', cor: '#2196f3', label: 'Fotos na Galeria', valor: stats.galeria, secao: 'galeria' },
        { icone: 'fa-graduation-cap', cor: '#9c27b0', label: 'Tutoriais', valor: stats.tutoriais, secao: 'tutoriais' },
        { icone: 'fa-users', cor: '#ff9800', label: 'Membros Ativos', valor: stats.membros, secao: 'membros' },
        { icone: 'fa-car', cor: '#f44336', label: 'Viaturas', valor: stats.viaturas, secao: 'viaturas' }
    ];

    container.innerHTML = `
    <!-- Boas-Vindas -->
    <div class="welcome-card" style="margin-bottom: 25px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:20px;">
      
      <div style="display:flex; align-items:center; gap:18px;">
        <!-- AVATAR DO DELEGADO -->
        <div class="welcome-avatar ${fotoDelegado ? 'com-foto' : ''}">
          ${fotoDelegado
            ? `<img src="${fotoDelegado}" alt="${usuario.nome}" onerror="this.parentElement.classList.remove('com-foto'); this.parentElement.innerHTML='<span>${iniciais(usuario.nome)}</span>'; this.remove();">`
            : `<span>${iniciais(usuario.nome)}</span>`
        }
        </div>
        
        <div>
          <h2 style="margin:0;">${saudacao}, <span>${escapar(usuario?.nome || 'Administrador')}</span>!</h2>
          <p style="margin: 5px 0 0; color: var(--texto-muted);">
            <i class="fa-solid fa-shield-halved" style="color: var(--dourado);"></i>
            ${escapar(usuario?.cargo || usuario?.role || 'Administrador')}
          </p>
        </div>
      </div>

      <div style="text-align:right; min-width:150px;">
        <p style="margin:0; font-size:12px; color: var(--texto-muted); text-transform:uppercase; letter-spacing:1px;">Último acesso</p>
        <p style="margin:3px 0 0; color: var(--dourado); font-weight:600; font-size:14px;">${formatarData(ultimoAcesso)}</p>
      </div>
    </div>

    <!-- Cards de Status -->
    <h3 style="color: var(--dourado); font-size:16px; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
      <i class="fa-solid fa-chart-line"></i> Visão Geral
    </h3>
    <div class="dash-stats-grid">
      ${cards.map(c => `
        <div class="dash-stat-card" onclick="window.location.hash='${c.secao}'" style="--cor-stat: ${c.cor};">
          <div class="dash-stat-icon">
            <i class="fa-solid ${c.icone}"></i>
          </div>
          <div class="dash-stat-info">
            <span class="dash-stat-valor">${c.valor}</span>
            <span class="dash-stat-label">${c.label}</span>
          </div>
          <i class="fa-solid fa-arrow-right dash-stat-arrow"></i>
        </div>
      `).join('')}
    </div>

    <!-- Ações Rápidas -->
    <h3 style="color: var(--dourado); font-size:16px; margin: 35px 0 15px; display:flex; align-items:center; gap:10px;">
      <i class="fa-solid fa-bolt"></i> Ações Rápidas
    </h3>
    <div class="dash-acoes-grid">
      <a href="#avisos" class="dash-acao-btn">
        <i class="fa-solid fa-plus"></i>
        <div>
          <strong>Novo Aviso</strong>
          <span>Publicar no mural</span>
        </div>
      </a>
      <a href="#tutoriais" class="dash-acao-btn">
        <i class="fa-solid fa-plus"></i>
        <div>
          <strong>Novo Tutorial</strong>
          <span>Adicionar vídeo</span>
        </div>
      </a>
      <a href="#membros" class="dash-acao-btn">
        <i class="fa-solid fa-users-gear"></i>
        <div>
          <strong>Atualizar Hierarquia</strong>
          <span>Gerenciar membros</span>
        </div>
      </a>
      <a href="#concursos" class="dash-acao-btn">
        <i class="fa-solid fa-file-circle-plus"></i>
        <div>
          <strong>Gerenciar Concursos</strong>
          <span>Editar editais</span>
        </div>
      </a>
    </div>

    <!-- Últimas Atualizações -->
    <h3 style="color: var(--dourado); font-size:16px; margin: 35px 0 15px; display:flex; align-items:center; gap:10px;">
      <i class="fa-solid fa-clock-rotate-left"></i> Últimas Publicações
    </h3>
    <div class="dash-ultimas">
      ${stats.ultimosAvisos.length === 0 ? `
        <p style="color: var(--texto-muted); text-align:center; padding: 30px; font-style: italic;">Nenhuma publicação recente.</p>
      ` : stats.ultimosAvisos.map(a => {
            const data = new Date(a.criado_em);
            const diffHoras = Math.floor((Date.now() - data) / (1000 * 60 * 60));
            const tempo = diffHoras < 1 ? 'Agora há pouco' :
                diffHoras < 24 ? `Há ${diffHoras}h` :
                    diffHoras < 48 ? 'Ontem' :
                        `Há ${Math.floor(diffHoras / 24)} dias`;

            return `
          <div class="dash-ultima-item">
            <div class="dash-ultima-icon"><i class="fa-solid fa-newspaper"></i></div>
            <div style="flex:1;">
              <strong>${escapar(a.titulo)}</strong>
              <span>Publicado ${tempo}</span>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--texto-muted);"></i>
          </div>
        `;
        }).join('')}
    </div>
  `;
}