/* ==========================================================================
   CLIENTES.JS — CRUD completo de clientes
   ========================================================================== */

const Clientes = {
  termoBusca: '',

  render() {
    const container = document.getElementById('lista-clientes');
    const clientes = this.obterFiltrados();

    if (ClientesDB.listar().length === 0) {
      container.innerHTML = this.estadoVazio();
      this.atualizarContador(0, 0);
      return;
    }

    if (clientes.length === 0) {
      container.innerHTML = `<div class="estado-vazio">
        <div class="estado-vazio__icone">🔍</div>
        <p>Nenhum cliente encontrado para "${escapeHTML(this.termoBusca)}".</p>
      </div>`;
      this.atualizarContador(clientes.length, ClientesDB.listar().length);
      return;
    }

    container.innerHTML = `<div class="tabela-wrap"><table class="tabela">
      <thead><tr>
        <th>Nome</th><th>Telefone</th><th>Valor</th><th>Frequência</th>
        <th>Próxima limpeza</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>
        ${clientes.map(c => `
          <tr>
            <td data-rotulo="Nome"><strong>${escapeHTML(c.nome)}</strong></td>
            <td data-rotulo="Telefone">${escapeHTML(c.telefone) || '—'}</td>
            <td data-rotulo="Valor">${formatarMoeda(c.valorServico)}</td>
            <td data-rotulo="Frequência">${escapeHTML(c.frequencia) || '—'}</td>
            <td data-rotulo="Próxima limpeza">${formatarData(c.proximaLimpeza)}</td>
            <td data-rotulo="Status"><span class="badge badge--${c.status === 'Ativo' ? 'verde' : 'cinza'}">${c.status}</span></td>
            <td class="tabela__acoes">
              <button class="btn-icone" title="Ver detalhes" data-ver="${c.id}">👁</button>
              <button class="btn-icone" title="Editar" data-editar="${c.id}">✎</button>
              <button class="btn-icone btn-icone--perigo" title="Excluir" data-excluir="${c.id}">🗑</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table></div>`;

    this.atualizarContador(clientes.length, ClientesDB.listar().length);

    container.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => this.verDetalhes(b.dataset.ver)));
    container.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => this.abrirFormulario(b.dataset.editar)));
    container.querySelectorAll('[data-excluir]').forEach(b => b.addEventListener('click', () => this.excluir(b.dataset.excluir)));
  },

  estadoVazio() {
    return `<div class="estado-vazio">
      <div class="estado-vazio__icone">🧺</div>
      <h3>Nenhum cliente cadastrado ainda</h3>
      <p>Adicione o primeiro cliente para começar a organizar os serviços.</p>
      <button class="btn btn--primario" onclick="Clientes.abrirFormulario()">+ Adicionar cliente</button>
    </div>`;
  },

  atualizarContador(exibindo, total) {
    const el = document.getElementById('contador-clientes');
    if (el) el.textContent = `${total} cliente${total === 1 ? '' : 's'} cadastrado${total === 1 ? '' : 's'}`;
  },

  obterFiltrados() {
    const termo = this.termoBusca.trim().toLowerCase();
    let lista = ClientesDB.listar().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (termo) {
      lista = lista.filter(c =>
        c.nome.toLowerCase().includes(termo) ||
        (c.telefone || '').toLowerCase().includes(termo)
      );
    }
    return lista;
  },

  buscar(termo) {
    this.termoBusca = termo;
    this.render();
  },

  abrirFormulario(id = null) {
    const cliente = id ? ClientesDB.buscarPorId(id) : null;
    const form = document.getElementById('form-cliente');
    form.reset();
    document.getElementById('cliente-id').value = cliente ? cliente.id : '';
    document.getElementById('modal-cliente-titulo').textContent = cliente ? 'Editar cliente' : 'Novo cliente';

    if (cliente) {
      document.getElementById('cliente-nome').value = cliente.nome || '';
      document.getElementById('cliente-telefone').value = cliente.telefone || '';
      document.getElementById('cliente-endereco').value = cliente.endereco || '';
      document.getElementById('cliente-valor').value = cliente.valorServico || '';
      document.getElementById('cliente-frequencia').value = cliente.frequencia || 'Semanal';
      document.getElementById('cliente-ultima-limpeza').value = cliente.ultimaLimpeza || '';
      document.getElementById('cliente-proxima-limpeza').value = cliente.proximaLimpeza || '';
      document.getElementById('cliente-status').value = cliente.status || 'Ativo';
      document.getElementById('cliente-observacoes').value = cliente.observacoes || '';
    } else {
      document.getElementById('cliente-status').value = 'Ativo';
      document.getElementById('cliente-frequencia').value = 'Semanal';
    }

    abrirModal('modal-cliente');
    document.getElementById('cliente-nome').focus();
  },

  salvar(event) {
    event.preventDefault();

    const nome = document.getElementById('cliente-nome').value.trim();
    if (!nome) { mostrarToast('Informe o nome do cliente.', 'erro'); return; }

    const valorServico = parseValorMonetario(document.getElementById('cliente-valor').value);
    if (valorServico < 0) { mostrarToast('O valor do serviço não pode ser negativo.', 'erro'); return; }

    const cliente = {
      id: document.getElementById('cliente-id').value || null,
      nome,
      telefone: document.getElementById('cliente-telefone').value.trim(),
      endereco: document.getElementById('cliente-endereco').value.trim(),
      valorServico,
      frequencia: document.getElementById('cliente-frequencia').value,
      ultimaLimpeza: document.getElementById('cliente-ultima-limpeza').value,
      proximaLimpeza: document.getElementById('cliente-proxima-limpeza').value,
      status: document.getElementById('cliente-status').value,
      observacoes: document.getElementById('cliente-observacoes').value.trim()
    };

    ClientesDB.salvar(cliente);
    fecharModal('modal-cliente');
    mostrarToast('Cliente salvo com sucesso.');
    this.render();
  },

  async excluir(id) {
    const cliente = ClientesDB.buscarPorId(id);
    if (!cliente) return;
    const confirmado = await confirmarAcao(
      'Excluir cliente?',
      `Tem certeza que deseja excluir "${cliente.nome}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;
    ClientesDB.excluir(id);
    mostrarToast('Cliente excluído.');
    this.render();
  },

  verDetalhes(id) {
    const c = ClientesDB.buscarPorId(id);
    if (!c) return;
    const corpo = document.getElementById('detalhes-cliente-corpo');
    corpo.innerHTML = `
      <dl class="lista-detalhes">
        <dt>Nome</dt><dd>${escapeHTML(c.nome)}</dd>
        <dt>Telefone</dt><dd>${escapeHTML(c.telefone) || '—'}</dd>
        <dt>Endereço</dt><dd>${escapeHTML(c.endereco) || '—'}</dd>
        <dt>Valor do serviço</dt><dd>${formatarMoeda(c.valorServico)}</dd>
        <dt>Frequência</dt><dd>${escapeHTML(c.frequencia) || '—'}</dd>
        <dt>Última limpeza</dt><dd>${formatarData(c.ultimaLimpeza)}</dd>
        <dt>Próxima limpeza</dt><dd>${formatarData(c.proximaLimpeza)}</dd>
        <dt>Status</dt><dd><span class="badge badge--${c.status === 'Ativo' ? 'verde' : 'cinza'}">${c.status}</span></dd>
        <dt>Observações</dt><dd>${escapeHTML(c.observacoes) || '—'}</dd>
      </dl>`;
    abrirModal('modal-detalhes-cliente');
  }
};
