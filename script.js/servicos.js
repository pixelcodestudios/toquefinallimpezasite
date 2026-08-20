/* ==========================================================================
   SERVICOS.JS — CRUD de serviços + visualização de agenda
   ========================================================================== */

const Servicos = {
  filtroStatus: 'todos',

  render() {
    this.preencherSelectClientes();
    this.preencherSelectFuncionarios();

    const todos = ServicosDB.listar();
    const container = document.getElementById('lista-servicos');

    if (todos.length === 0) {
      container.innerHTML = `<div class="estado-vazio">
        <div class="estado-vazio__icone">📅</div>
        <h3>Nenhum serviço agendado ainda</h3>
        <p>Cadastre clientes e agende o primeiro serviço para começar a preencher a agenda.</p>
        <button class="btn btn--primario" onclick="Servicos.abrirFormulario()">+ Agendar serviço</button>
      </div>`;
      return;
    }

    let lista = todos.slice().sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
    if (this.filtroStatus !== 'todos') {
      lista = lista.filter(s => s.status === this.filtroStatus);
    }

    if (lista.length === 0) {
      container.innerHTML = `<div class="estado-vazio">
        <div class="estado-vazio__icone">🔍</div>
        <p>Nenhum serviço com status "${escapeHTML(this.filtroStatus)}".</p>
      </div>`;
      return;
    }

    container.innerHTML = `<div class="tabela-wrap"><table class="tabela">
      <thead><tr>
        <th>Data</th><th>Horário</th><th>Cliente</th><th>Funcionário</th>
        <th>Valor</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>
        ${lista.map(s => {
          const cliente = ClientesDB.buscarPorId(s.clienteId);
          const funcionario = FuncionariosDB.buscarPorId(s.funcionarioId);
          return `<tr>
            <td data-rotulo="Data">${formatarData(s.data)}</td>
            <td data-rotulo="Horário">${escapeHTML(s.horario) || '—'}</td>
            <td data-rotulo="Cliente">${escapeHTML(cliente ? cliente.nome : '(cliente removido)')}</td>
            <td data-rotulo="Funcionário">${escapeHTML(funcionario ? funcionario.nome : '—')}</td>
            <td data-rotulo="Valor">${formatarMoeda(s.valor)}</td>
            <td data-rotulo="Status"><span class="badge badge--${this.corStatus(s.status)}">${s.status}</span></td>
            <td class="tabela__acoes">
              <button class="btn-icone" title="Editar" data-editar="${s.id}">✎</button>
              <button class="btn-icone btn-icone--perigo" title="Excluir" data-excluir="${s.id}">🗑</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`;

    container.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => this.abrirFormulario(b.dataset.editar)));
    container.querySelectorAll('[data-excluir]').forEach(b => b.addEventListener('click', () => this.excluir(b.dataset.excluir)));
  },

  corStatus(status) {
    return { 'Agendado': 'azul', 'Concluído': 'verde', 'Cancelado': 'vermelho', 'Pendente': 'amarelo' }[status] || 'cinza';
  },

  filtrar(status) {
    this.filtroStatus = status;
    document.querySelectorAll('.filtro-status-servico').forEach(b => {
      b.classList.toggle('chip--ativo', b.dataset.status === status);
    });
    this.render();
  },

  preencherSelectClientes() {
    const select = document.getElementById('servico-cliente');
    const clientes = ClientesDB.listar().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    select.innerHTML = '<option value="">Selecione um cliente</option>' +
      clientes.map(c => `<option value="${c.id}">${escapeHTML(c.nome)}</option>`).join('');
  },

  preencherSelectFuncionarios() {
    const select = document.getElementById('servico-funcionario');
    const funcionarios = FuncionariosDB.listar().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    select.innerHTML = '<option value="">Nenhum / a definir</option>' +
      funcionarios.map(f => `<option value="${f.id}">${escapeHTML(f.nome)}</option>`).join('');
  },

  abrirFormulario(id = null) {
    if (ClientesDB.listar().length === 0) {
      mostrarToast('Cadastre um cliente antes de agendar um serviço.', 'erro');
      return;
    }
    this.preencherSelectClientes();
    this.preencherSelectFuncionarios();

    const servico = id ? ServicosDB.buscarPorId(id) : null;
    const form = document.getElementById('form-servico');
    form.reset();
    document.getElementById('servico-id').value = servico ? servico.id : '';
    document.getElementById('modal-servico-titulo').textContent = servico ? 'Editar serviço' : 'Agendar serviço';

    if (servico) {
      document.getElementById('servico-cliente').value = servico.clienteId || '';
      document.getElementById('servico-data').value = servico.data || '';
      document.getElementById('servico-horario').value = servico.horario || '';
      document.getElementById('servico-funcionario').value = servico.funcionarioId || '';
      document.getElementById('servico-valor').value = servico.valor || '';
      document.getElementById('servico-status').value = servico.status || 'Agendado';
      document.getElementById('servico-observacoes').value = servico.observacoes || '';
    } else {
      document.getElementById('servico-data').value = hojeISO();
      document.getElementById('servico-status').value = 'Agendado';
    }

    abrirModal('modal-servico');
  },

  aoSelecionarCliente() {
    // Preenche o valor automaticamente com o valor cadastrado do cliente, ao criar um novo serviço
    const idCampo = document.getElementById('servico-id').value;
    if (idCampo) return; // não sobrescreve em edições
    const clienteId = document.getElementById('servico-cliente').value;
    const cliente = ClientesDB.buscarPorId(clienteId);
    if (cliente && !document.getElementById('servico-valor').value) {
      document.getElementById('servico-valor').value = cliente.valorServico || '';
    }
  },

  salvar(event) {
    event.preventDefault();

    const clienteId = document.getElementById('servico-cliente').value;
    if (!clienteId) { mostrarToast('Selecione um cliente.', 'erro'); return; }

    const data = document.getElementById('servico-data').value;
    if (!data) { mostrarToast('Informe a data do serviço.', 'erro'); return; }

    const valor = parseValorMonetario(document.getElementById('servico-valor').value);
    if (valor < 0) { mostrarToast('O valor não pode ser negativo.', 'erro'); return; }

    const servico = {
      id: document.getElementById('servico-id').value || null,
      clienteId,
      data,
      horario: document.getElementById('servico-horario').value,
      funcionarioId: document.getElementById('servico-funcionario').value || null,
      valor,
      status: document.getElementById('servico-status').value,
      observacoes: document.getElementById('servico-observacoes').value.trim()
    };

    ServicosDB.salvar(servico);
    fecharModal('modal-servico');
    mostrarToast('Serviço salvo com sucesso.');
    this.render();
  },

  async excluir(id) {
    const confirmado = await confirmarAcao(
      'Excluir serviço?',
      'Tem certeza que deseja excluir este serviço da agenda? Essa ação não pode ser desfeita.'
    );
    if (!confirmado) return;
    ServicosDB.excluir(id);
    mostrarToast('Serviço excluído.');
    this.render();
  }
};
