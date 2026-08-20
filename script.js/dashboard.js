/* ==========================================================================
   DASHBOARD.JS — Visão geral do negócio
   ========================================================================== */

const Dashboard = {
  render() {
    const hoje = hojeISO();
    const mesAtual = mesAtualISO();

    const clientes = ClientesDB.listar();
    const servicos = ServicosDB.listar();
    const movimentacoes = FinanceiroDB.listar();

    const movMesAtual = movimentacoes.filter(m => m.data && m.data.startsWith(mesAtual));
    const faturamento = movMesAtual.filter(m => m.tipo === 'Receita').reduce((s, m) => s + m.valor, 0);
    const despesas = movMesAtual.filter(m => m.tipo === 'Despesa').reduce((s, m) => s + m.valor, 0);
    const lucro = faturamento - despesas;

    const servicosMes = servicos.filter(s => s.data && s.data.startsWith(mesAtual));
    const concluidos = servicosMes.filter(s => s.status === 'Concluído').length;
    const pendentes = servicos.filter(s => s.status === 'Pendente' || s.status === 'Agendado').length;
    const clientesAtivos = clientes.filter(c => c.status === 'Ativo').length;

    document.getElementById('dash-faturamento').textContent = formatarMoeda(faturamento);
    document.getElementById('dash-despesas').textContent = formatarMoeda(despesas);
    const elLucro = document.getElementById('dash-lucro');
    elLucro.textContent = formatarMoeda(lucro);
    elLucro.classList.toggle('valor--negativo', lucro < 0);
    document.getElementById('dash-clientes').textContent = clientesAtivos;
    document.getElementById('dash-concluidos').textContent = concluidos;
    document.getElementById('dash-pendentes').textContent = pendentes;

    this.renderProximosServicos(servicos, clientes, hoje);
    this.renderGrafico(movimentacoes);
  },

  renderProximosServicos(servicos, clientes, hoje) {
    const container = document.getElementById('dash-proximos-servicos');
    const proximos = servicos
      .filter(s => s.data >= hoje && s.status !== 'Cancelado' && s.status !== 'Concluído')
      .sort((a, b) => (a.data + (a.horario || '')).localeCompare(b.data + (b.horario || '')))
      .slice(0, 5);

    if (proximos.length === 0) {
      container.innerHTML = `<div class="estado-vazio estado-vazio--compacto">
        <p>Nenhum serviço agendado para os próximos dias.</p>
      </div>`;
      return;
    }

    container.innerHTML = proximos.map(s => {
      const cliente = clientes.find(c => c.id === s.clienteId);
      return `<div class="item-proximo-servico">
        <div class="item-proximo-servico__data">
          <span>${formatarData(s.data).slice(0, 5)}</span>
          <span class="item-proximo-servico__hora">${escapeHTML(s.horario) || ''}</span>
        </div>
        <div class="item-proximo-servico__info">
          <strong>${escapeHTML(cliente ? cliente.nome : 'Cliente removido')}</strong>
          <span class="badge badge--${Servicos.corStatus(s.status)}">${s.status}</span>
        </div>
        <div class="item-proximo-servico__valor">${formatarMoeda(s.valor)}</div>
      </div>`;
    }).join('');
  },

  renderGrafico(movimentacoes) {
    const canvas = document.getElementById('grafico-faturamento');
    const ctx = canvas.getContext('2d');

    // Ajusta resolução ao tamanho real exibido (responsivo, sem ficar borrado)
    const dpr = window.devicePixelRatio || 1;
    const largura = canvas.parentElement.clientWidth;
    const altura = 220;
    canvas.width = largura * dpr;
    canvas.height = altura * dpr;
    canvas.style.width = largura + 'px';
    canvas.style.height = altura + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largura, altura);

    // Últimos 6 meses (incluindo o atual)
    const meses = [];
    const dataRef = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(dataRef.getFullYear(), dataRef.getMonth() - i, 1);
      meses.push({
        chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        rotulo: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      });
    }

    const valores = meses.map(m =>
      movimentacoes
        .filter(mov => mov.tipo === 'Receita' && mov.data && mov.data.startsWith(m.chave))
        .reduce((s, mov) => s + mov.valor, 0)
    );

    const temDados = valores.some(v => v > 0);
    if (!temDados) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ainda não há receitas registradas para exibir no gráfico.', largura / 2, altura / 2);
      return;
    }

    const maxValor = Math.max(...valores, 1);
    const paddingBase = 30;
    const larguraUtil = largura - 20;
    const larguraBarra = (larguraUtil / meses.length) * 0.5;
    const espacamento = larguraUtil / meses.length;

    meses.forEach((m, i) => {
      const x = 10 + i * espacamento + (espacamento - larguraBarra) / 2;
      const alturaBarra = (valores[i] / maxValor) * (altura - paddingBase - 30);
      const y = altura - paddingBase - alturaBarra;

      const gradiente = ctx.createLinearGradient(0, y, 0, altura - paddingBase);
      gradiente.addColorStop(0, '#0d9488');
      gradiente.addColorStop(1, '#14b8a6');
      ctx.fillStyle = gradiente;

      const raio = 6;
      ctx.beginPath();
      ctx.moveTo(x, y + raio);
      ctx.arcTo(x, y, x + raio, y, raio);
      ctx.arcTo(x + larguraBarra, y, x + larguraBarra, y + raio, raio);
      ctx.lineTo(x + larguraBarra, altura - paddingBase);
      ctx.lineTo(x, altura - paddingBase);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.rotulo, x + larguraBarra / 2, altura - 10);

      if (valores[i] > 0) {
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        const rotuloValor = valores[i] >= 1000
          ? `${(valores[i] / 1000).toFixed(1).replace('.0', '')}k`
          : Math.round(valores[i]).toString();
        ctx.fillText(rotuloValor, x + larguraBarra / 2, y - 8);
      }
    });
  }
};

window.addEventListener('resize', () => {
  const secaoAtiva = document.getElementById('secao-dashboard');
  if (secaoAtiva && secaoAtiva.classList.contains('secao--ativa')) {
    Dashboard.renderGrafico(FinanceiroDB.listar());
  }
});
