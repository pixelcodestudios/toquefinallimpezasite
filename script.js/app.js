/* ==========================================================================
   APP.JS
   Núcleo do sistema: inicialização, navegação entre seções,
   funções utilitárias compartilhadas (moeda, datas, toasts, confirmação).
   ========================================================================== */

/* ---------------- Utilitários de formatação ---------------- */

function formatarMoeda(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* Converte string "1234,56" ou "1234.56" digitada pelo usuário em número */
function parseValorMonetario(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const limpo = String(str).trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
}

/* Recebe "2026-08-19" (input date) e devolve "19/08/2026" */
function formatarData(isoDate) {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/* "2026-08" do mês atual, útil para filtros */
function mesAtualISO() {
  return hojeISO().slice(0, 7);
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------------- Toasts (mensagens de confirmação) ---------------- */

function mostrarToast(mensagem, tipo = 'sucesso') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  const icone = tipo === 'sucesso' ? '✓' : tipo === 'erro' ? '✕' : 'ℹ';
  toast.innerHTML = `<span class="toast__icone">${icone}</span><span>${escapeHTML(mensagem)}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visivel'));
  setTimeout(() => {
    toast.classList.remove('toast--visivel');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ---------------- Modal de confirmação (para ações destrutivas) ---------------- */

function confirmarAcao(titulo, descricao) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-confirmacao');
    overlay.querySelector('.modal__titulo').textContent = titulo;
    overlay.querySelector('.modal__descricao').textContent = descricao;
    overlay.classList.add('modal--aberto');

    const btnConfirmar = document.getElementById('btn-confirmar-acao');
    const btnCancelar = document.getElementById('btn-cancelar-acao');

    function limpar(resultado) {
      overlay.classList.remove('modal--aberto');
      btnConfirmar.removeEventListener('click', onConfirmar);
      btnCancelar.removeEventListener('click', onCancelar);
      resolve(resultado);
    }
    function onConfirmar() { limpar(true); }
    function onCancelar() { limpar(false); }

    btnConfirmar.addEventListener('click', onConfirmar);
    btnCancelar.addEventListener('click', onCancelar);
  });
}

/* ---------------- Modal genérico (formulários) ---------------- */

function abrirModal(idModal) {
  document.getElementById(idModal).classList.add('modal--aberto');
}
function fecharModal(idModal) {
  document.getElementById(idModal).classList.remove('modal--aberto');
}

/* ---------------- Navegação entre seções ---------------- */

const SECOES = ['dashboard', 'clientes', 'servicos', 'funcionarios', 'financeiro', 'orcamento', 'relatorios', 'configuracoes'];

const RENDERIZADORES = {
  dashboard: () => Dashboard.render(),
  clientes: () => Clientes.render(),
  servicos: () => Servicos.render(),
  funcionarios: () => Funcionarios.render(),
  financeiro: () => Financeiro.render(),
  orcamento: () => Orcamento.render(),
  relatorios: () => Relatorios.render(),
  configuracoes: () => Configuracoes.render()
};

function navegarPara(secao) {
  if (!SECOES.includes(secao)) secao = 'dashboard';

  SECOES.forEach(s => {
    const el = document.getElementById(`secao-${s}`);
    if (el) el.classList.toggle('secao--ativa', s === secao);
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('nav-link--ativo', link.dataset.secao === secao);
  });

  const menuLateral = document.getElementById('menu-lateral');
  menuLateral.classList.remove('menu-lateral--aberto');
  document.getElementById('overlay-menu').classList.remove('overlay-menu--visivel');

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  if (RENDERIZADORES[secao]) RENDERIZADORES[secao]();

  location.hash = secao;
}

function aplicarNomeEmpresa() {
  const config = ConfigDB.obter();
  const nome = config.empresa.nome || 'Toque Final Limpeza';
  document.querySelectorAll('.js-nome-empresa').forEach(el => el.textContent = nome);
  document.title = `${nome} — Painel Administrativo`;
}

/* ---------------- Inicialização ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  inicializarStorage();
  aplicarNomeEmpresa();

  // Links de navegação (sidebar + menu mobile)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navegarPara(link.dataset.secao);
    });
  });

  // Botão hambúrguer (mobile)
  document.getElementById('btn-abrir-menu').addEventListener('click', () => {
    document.getElementById('menu-lateral').classList.add('menu-lateral--aberto');
    document.getElementById('overlay-menu').classList.add('overlay-menu--visivel');
  });
  document.getElementById('overlay-menu').addEventListener('click', () => {
    document.getElementById('menu-lateral').classList.remove('menu-lateral--aberto');
    document.getElementById('overlay-menu').classList.remove('overlay-menu--visivel');
  });

  // Fecha modais clicando fora do conteúdo, ou no "X"
  document.querySelectorAll('.modal').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('modal--aberto');
    });
  });
  document.querySelectorAll('[data-fechar-modal]').forEach(btn => {
    btn.addEventListener('click', () => fecharModal(btn.dataset.fecharModal));
  });

  // Seção inicial (via hash da URL, ou dashboard por padrão)
  const secaoInicial = location.hash ? location.hash.replace('#', '') : 'dashboard';
  navegarPara(secaoInicial);
});
