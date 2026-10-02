/* ============================================================
   UTILITÁRIOS GERAIS
   ============================================================ */

/* -------- TOAST -------- */
export function toast(mensagem, tipo = 'info', duracao = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('Toast container não encontrado');
        return;
    }

    const icones = {
        info: 'fa-circle-info',
        sucesso: 'fa-circle-check',
        erro: 'fa-circle-xmark',
        aviso: 'fa-triangle-exclamation'
    };

    const el = document.createElement('div');
    el.className = `toast toast-${tipo}`;
    el.innerHTML = `
    <i class="fa-solid ${icones[tipo] || icones.info}"></i>
    <span>${mensagem}</span>
  `;
    container.appendChild(el);

    setTimeout(() => {
        el.classList.add('saindo');
        setTimeout(() => el.remove(), 400);
    }, duracao);
}

/* -------- MODAL -------- */
export function abrirModal({ titulo, conteudo, confirmar, cancelar, onConfirmar, onCancelar }) {
    const modal = document.getElementById('modalGenerico');
    const tituloEl = document.getElementById('modalTitulo');
    const conteudoEl = document.getElementById('modalConteudo');
    const btnConfirmar = document.getElementById('modalConfirmar');
    const btnCancelar = document.getElementById('modalCancelar');

    tituloEl.textContent = titulo || 'Confirmação';
    conteudoEl.innerHTML = conteudo || '';

    btnConfirmar.textContent = confirmar || 'Confirmar';
    btnCancelar.textContent = cancelar || 'Cancelar';

    modal.classList.add('open');

    const novoConfirmar = btnConfirmar.cloneNode(true);
    const novoCancelar = btnCancelar.cloneNode(true);
    btnConfirmar.replaceWith(novoConfirmar);
    btnCancelar.replaceWith(novoCancelar);

    novoConfirmar.addEventListener('click', () => {
        if (onConfirmar) onConfirmar();
        modal.classList.remove('open');
    });

    novoCancelar.addEventListener('click', () => {
        if (onCancelar) onCancelar();
        modal.classList.remove('open');
    });
}

export function fecharModal() {
    document.getElementById('modalGenerico')?.classList.remove('open');
}

/* -------- FORMATAÇÃO -------- */
export function dataAgora() {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

export function horaAgora() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

export function dataHoraAgora() {
    return `${dataAgora()} às ${horaAgora()}`;
}

/* -------- HELPERS -------- */
export function escapar(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function slug(str) {
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function iniciais(nome) {
    if (!nome) return '??';
    const partes = nome.trim().split(' ').filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}