/* ==========================================================================
   CONFIGURACOES.JS — Dados da empresa, preços do orçamento e categorias
   ========================================================================== */

const Configuracoes = {
  render() {
    const config = ConfigDB.obter();

    document.getElementById('config-nome-empresa').value = config.empresa.nome || '';
    document.getElementById('config-telefone').value = config.empresa.telefone || '';
    document.getElementById('config-endereco').value = config.empresa.endereco || '';

    document.getElementById('config-preco-m2').value = config.precos.valorM2 || '';
    document.getElementById('config-preco-comodo').value = config.precos.valorComodo || '';
    document.getElementById('config-preco-banheiro').value = config.precos.valorBanheiro || '';
    document.getElementById('config-mult-pesada').value = config.precos.multiplicadores.pesada || '';
    document.getElementById('config-mult-pos-obra').value = config.precos.multiplicadores.pos_obra || '';

    this.renderCategorias('categoriasReceitas', 'lista-categorias-receitas');
    this.renderCategorias('categoriasDespesas', 'lista-categorias-despesas');
  },

  renderCategorias(chave, idContainer) {
    const config = ConfigDB.obter();
    const categorias = config[chave] || [];
    const container = document.getElementById(idContainer);

    if (categorias.length === 0) {
      container.innerHTML = '<p class="texto-fraco">Nenhuma categoria cadastrada.</p>';
      return;
    }

    container.innerHTML = categorias.map((c, i) => `
      <span class="tag">
        ${escapeHTML(c)}
        <button type="button" class="tag__remover" data-chave="${chave}" data-indice="${i}" title="Remover categoria">×</button>
      </span>
    `).join('');

    container.querySelectorAll('.tag__remover').forEach(btn => {
      btn.addEventListener('click', () => this.removerCategoria(btn.dataset.chave, parseInt(btn.dataset.indice)));
    });
  },

  adicionarCategoria(chave, idInput) {
    const input = document.getElementById(idInput);
    const valor = input.value.trim();
    if (!valor) return;

    const config = ConfigDB.obter();
    if (config[chave].some(c => c.toLowerCase() === valor.toLowerCase())) {
      mostrarToast('Essa categoria já existe.', 'erro');
      return;
    }
    config[chave].push(valor);
    ConfigDB.salvar(config);
    input.value = '';
    this.renderCategorias(chave, chave === 'categoriasReceitas' ? 'lista-categorias-receitas' : 'lista-categorias-despesas');
    mostrarToast('Categoria adicionada.');
  },

  async removerCategoria(chave, indice) {
    const confirmado = await confirmarAcao('Remover categoria?', 'Movimentações já lançadas com essa categoria não serão alteradas.');
    if (!confirmado) return;
    const config = ConfigDB.obter();
    config[chave].splice(indice, 1);
    ConfigDB.salvar(config);
    this.renderCategorias(chave, chave === 'categoriasReceitas' ? 'lista-categorias-receitas' : 'lista-categorias-despesas');
    mostrarToast('Categoria removida.');
  },

  salvarEmpresa(event) {
    event.preventDefault();
    const config = ConfigDB.obter();
    config.empresa.nome = document.getElementById('config-nome-empresa').value.trim() || 'Toque Final Limpeza';
    config.empresa.telefone = document.getElementById('config-telefone').value.trim();
    config.empresa.endereco = document.getElementById('config-endereco').value.trim();
    ConfigDB.salvar(config);
    aplicarNomeEmpresa();
    mostrarToast('Dados da empresa salvos.');
  },

  salvarPrecos(event) {
    event.preventDefault();
    const config = ConfigDB.obter();

    const m2 = parseValorMonetario(document.getElementById('config-preco-m2').value);
    const comodo = parseValorMonetario(document.getElementById('config-preco-comodo').value);
    const banheiro = parseValorMonetario(document.getElementById('config-preco-banheiro').value);
    const multPesada = parseFloat(document.getElementById('config-mult-pesada').value) || 1;
    const multPosObra = parseFloat(document.getElementById('config-mult-pos-obra').value) || 1;

    if (m2 < 0 || comodo < 0 || banheiro < 0) {
      mostrarToast('Os preços não podem ser negativos.', 'erro');
      return;
    }

    config.precos.valorM2 = m2 || null;
    config.precos.valorComodo = comodo || null;
    config.precos.valorBanheiro = banheiro || null;
    config.precos.multiplicadores.pesada = multPesada;
    config.precos.multiplicadores.pos_obra = multPosObra;

    ConfigDB.salvar(config);
    mostrarToast('Preços do orçamento salvos.');
  }
};
