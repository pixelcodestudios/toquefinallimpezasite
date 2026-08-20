/* ==========================================================================
   FUNCIONARIOS.JS — Cadastro de funcionários
   ========================================================================== */

const Funcionarios = {
  render() {
    const lista = FuncionariosDB.listar().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const container = document.getElementById('lista-funcionarios');

    if (lista.length === 0) {
      container.innerHTML = `<div class="estado-vazio">
        <div class="estado-vazio__icone">🧑‍🤝‍🧑</div>
        <h3>Nenhum funcionário cadastrado ainda</h3>
        <p>Adicione a equipe para poder atribuir funcionários aos serviços.</p>
        <button class="btn btn--primario" onclick="Funcionarios.abrirFormulario()">+ Adicionar funcionário</button>
      </div>`;
      return;
    }

    container.innerHTML = `<div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Nome</th><th>Telefone</th><th>Forma de pagamento</th><th>Valor recebido</th><th></th></tr></thead>
      <tbody>
        ${lista.map(f => `
          <tr>
            <td data-rotulo="Nome"><strong>${escapeHTML(f.nome)}</strong></td>
            <td data-rotulo="Telefone">${escapeHTML(f.telefone) || '—'}</td>
            <td data-rotulo="Forma de pagamento">${escapeHTML(f.formaPagamento) || '—'}</td>
            <td data-rotulo="Valor recebido">${formatarMoeda(f.valorRecebido)}</td>
            <td class="tabela__acoes">
              <button class="btn-icone" title="Editar" data-editar="${f.id}">✎</button>
              <button class="btn-icone btn-icone--perigo" title="Excluir" data-excluir="${f.id}">🗑</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table></div>`;

    container.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => this.abrirFormulario(b.dataset.editar)));
    container.querySelectorAll('[data-excluir]').forEach(b => b.addEventListener('click', () => this.excluir(b.dataset.excluir)));
  },

  abrirFormulario(id = null) {
    const funcionario = id ? FuncionariosDB.buscarPorId(id) : null;
    const form = document.getElementById('form-funcionario');
    form.reset();
    document.getElementById('funcionario-id').value = funcionario ? funcionario.id : '';
    document.getElementById('modal-funcionario-titulo').textContent = funcionario ? 'Editar funcionário' : 'Novo funcionário';

    if (funcionario) {
      document.getElementById('funcionario-nome').value = funcionario.nome || '';
      document.getElementById('funcionario-telefone').value = funcionario.telefone || '';
      document.getElementById('funcionario-forma-pagamento').value = funcionario.formaPagamento || '';
      document.getElementById('funcionario-valor').value = funcionario.valorRecebido || '';
      document.getElementById('funcionario-observacoes').value = funcionario.observacoes || '';
    }

    abrirModal('modal-funcionario');
    document.getElementById('funcionario-nome').focus();
  },

  salvar(event) {
    event.preventDefault();

    const nome = document.getElementById('funcionario-nome').value.trim();
    if (!nome) { mostrarToast('Informe o nome do funcionário.', 'erro'); return; }

    const valorRecebido = parseValorMonetario(document.getElementById('funcionario-valor').value);
    if (valorRecebido < 0) { mostrarToast('O valor recebido não pode ser negativo.', 'erro'); return; }

    const funcionario = {
      id: document.getElementById('funcionario-id').value || null,
      nome,
      telefone: document.getElementById('funcionario-telefone').value.trim(),
      formaPagamento: document.getElementById('funcionario-forma-pagamento').value.trim(),
      valorRecebido,
      observacoes: document.getElementById('funcionario-observacoes').value.trim()
    };

    FuncionariosDB.salvar(funcionario);
    fecharModal('modal-funcionario');
    mostrarToast('Funcionário salvo com sucesso.');
    this.render();
  },

  async excluir(id) {
    const funcionario = FuncionariosDB.buscarPorId(id);
    if (!funcionario) return;
    const confirmado = await confirmarAcao(
      'Excluir funcionário?',
      `Tem certeza que deseja excluir "${funcionario.nome}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;
    FuncionariosDB.excluir(id);
    mostrarToast('Funcionário excluído.');
    this.render();
  }
};
