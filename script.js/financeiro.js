/* ==========================================================================
   FINANCEIRO.JS — Receitas, despesas e cálculo de lucro
   ========================================================================== */

const Financeiro = {
  filtroTipo: 'todos',
  mesFiltro: '',

  render() {
    this.mesFiltro = this.mesFiltro || mesAtualISO();
    document.getElementById('financeiro-filtro-mes').value = this.mesFiltro;
    this.preencherSelectCategoria();

    const todas = FinanceiroDB.listar().filter(m => m.data && m.data.startsWith(this.mesFiltro));

    const receitas = todas.filter(m => m.tipo === 'Receita').reduce((s, m) => s + m.valor, 0);
    const despesas = todas.filter(m => m.tipo === 'Despesa').reduce((s, m) => s + m.valor, 0);
    const lucro = receitas - despesas;

    document.getElementById('financeiro-total-receitas').textContent = formatarMoeda(receitas);
    document.getElementById('financeiro-total-despesas').textContent = formatarMoeda(despesas);
    const elLucro = document.getElementById('financeiro-lucro');
    elLucro.textContent = formatarMoeda(lucro);
    elLucro.classList.toggle('valor--negativo', lucro < 0);

    let lista = todas.slice().sort((a, b) => b.data.localeCompare(a.data));
    if (this.filtroTipo !== 'todos') lista = lista.filter(m => m.tipo === this.filtroTipo);

    const container = document.getElementById('lista-financeiro');

    if (FinanceiroDB.listar().length === 0) {
      container.innerHTML = `<div class="estado-vazio">
        <div class="estado-vazio__icone">💰</div>
        <h3>Nenhuma movimentação registrada</h3>
        <p>Registre receitas e despesas para acompanhar o financeiro do mês.</p>
        <button class="btn btn--primario" onclick="Financeiro.abrirFormulario()">+ Nova movimentação</button>
      </div>`;
      return;
    }

    if (lista.length === 0) {
      container.innerHTML = `<div class="estado-vazio">
        <div class="estado-vazio__icone">🔍</div>
        <p>Nenhuma movimentação encontrada para este filtro.</p>
      </div>`;
      return;
    }

    container.innerHTML = `<div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th></th></tr></thead>
      <tbody>
        ${lista.map(m => `
          <tr>
            <td data-rotulo="Data">${formatarData(m.data)}</td>
            <td data-rotulo="Tipo"><span class="badge badge--${m.tipo === 'Receita' ? 'verde' : 'vermelho'}">${m.tipo}</span></td>
            <td data-rotulo="Categoria">${escapeHTML(m.categoria)}</td>
            <td data-rotulo="Descrição">${escapeHTML(m.descricao) || '—'}</td>
            <td data-rotulo="Valor" class="${m.tipo === 'Despesa' ? 'valor--negativo' : ''}">${m.tipo === 'Despesa' ? '- ' : ''}${formatarMoeda(m.valor)}</td>
            <td class="tabela__acoes">
              <button class="btn-icone" title="Editar" data-editar="${m.id}">✎</button>
              <button class="btn-icone btn-icone--perigo" title="Excluir" data-excluir="${m.id}">🗑</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table></div>`;

    container.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => this.abrirFormulario(b.dataset.editar)));
    container.querySelectorAll('[data-excluir]').forEach(b => b.addEventListener('click', () => this.excluir(b.dataset.excluir)));
  },

  filtrarMes(mes) {
    this.mesFiltro = mes;
    this.render();
  },

  filtrarTipo(tipo) {
    this.filtroTipo = tipo;
    document.querySelectorAll('.filtro-tipo-financeiro').forEach(b => {
      b.classList.toggle('chip--ativo', b.dataset.tipo === tipo);
    });
    this.render();
  },

  preencherSelectCategoria() {
    const config = ConfigDB.obter();
    const tipo = document.getElementById('mov-tipo').value || 'Receita';
    const categorias = tipo === 'Receita' ? config.categoriasReceitas : config.categoriasDespesas;
    const select = document.getElementById('mov-categoria');
    const atual = select.value;
    select.innerHTML = categorias.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    if (categorias.includes(atual)) select.value = atual;
  },

  abrirFormulario(id = null) {
    const mov = id ? FinanceiroDB.buscarPorId(id) : null;
    const form = document.getElementById('form-financeiro');
    form.reset();
    document.getElementById('mov-id').value = mov ? mov.id : '';
    document.getElementById('modal-financeiro-titulo').textContent = mov ? 'Editar movimentação' : 'Nova movimentação';
    document.getElementById('mov-tipo').value = mov ? mov.tipo : 'Receita';
    this.preencherSelectCategoria();

    if (mov) {
      document.getElementById('mov-categoria').value = mov.categoria || '';
      document.getElementById('mov-descricao').value = mov.descricao || '';
      document.getElementById('mov-valor').value = mov.valor || '';
      document.getElementById('mov-data').value = mov.data || '';
    } else {
      document.getElementById('mov-data').value = hojeISO();
    }

    abrirModal('modal-financeiro');
  },

  salvar(event) {
    event.preventDefault();

    const valor = parseValorMonetario(document.getElementById('mov-valor').value);
    if (valor <= 0) { mostrarToast('O valor deve ser maior que zero.', 'erro'); return; }

    const data = document.getElementById('mov-data').value;
    if (!data) { mostrarToast('Informe a data.', 'erro'); return; }

    const mov = {
      id: document.getElementById('mov-id').value || null,
      tipo: document.getElementById('mov-tipo').value,
      categoria: document.getElementById('mov-categoria').value,
      descricao: document.getElementById('mov-descricao').value.trim(),
      valor,
      data
    };

    FinanceiroDB.salvar(mov);
    fecharModal('modal-financeiro');
    mostrarToast('Movimentação salva com sucesso.');
    this.render();
  },

  async excluir(id) {
    const confirmado = await confirmarAcao(
      'Excluir movimentação?',
      'Tem certeza que deseja excluir este lançamento financeiro? Essa ação não pode ser desfeita.'
    );
    if (!confirmado) return;
    FinanceiroDB.excluir(id);
    mostrarToast('Movimentação excluída.');
    this.render();
  }
};
