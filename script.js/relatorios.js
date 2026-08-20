/* ==========================================================================
   RELATORIOS.JS — Relatórios mensais
   ========================================================================== */

const Relatorios = {
  mesFiltro: '',

  render() {
    this.mesFiltro = this.mesFiltro || mesAtualISO();
    document.getElementById('relatorio-filtro-mes').value = this.mesFiltro;

    const mov = FinanceiroDB.listar().filter(m => m.data && m.data.startsWith(this.mesFiltro));
    const servicos = ServicosDB.listar().filter(s => s.data && s.data.startsWith(this.mesFiltro));
    const clientes = ClientesDB.listar();

    const faturamento = mov.filter(m => m.tipo === 'Receita').reduce((s, m) => s + m.valor, 0);
    const despesas = mov.filter(m => m.tipo === 'Despesa').reduce((s, m) => s + m.valor, 0);
    const lucro = faturamento - despesas;

    const concluidos = servicos.filter(s => s.status === 'Concluído').length;
    const cancelados = servicos.filter(s => s.status === 'Cancelado').length;
    const clientesNovos = clientes.filter(c => c.criadoEm && c.criadoEm.startsWith(this.mesFiltro)).length;

    document.getElementById('relatorio-grid').innerHTML = `
      ${this.card('Faturamento', formatarMoeda(faturamento), '💰')}
      ${this.card('Despesas', formatarMoeda(despesas), '📉')}
      ${this.card('Lucro', formatarMoeda(lucro), '📈', lucro < 0)}
      ${this.card('Serviços no mês', servicos.length, '🧹')}
      ${this.card('Serviços concluídos', concluidos, '✅')}
      ${this.card('Serviços cancelados', cancelados, '❌')}
      ${this.card('Clientes novos', clientesNovos, '🆕')}
    `;
  },

  card(titulo, valor, icone, negativo = false) {
    return `<div class="card-relatorio">
      <span class="card-relatorio__icone">${icone}</span>
      <div>
        <span class="card-relatorio__titulo">${titulo}</span>
        <span class="card-relatorio__valor ${negativo ? 'valor--negativo' : ''}">${valor}</span>
      </div>
    </div>`;
  },

  filtrarMes(mes) {
    this.mesFiltro = mes;
    this.render();
  }
};
