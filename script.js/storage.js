/* ==========================================================================
   STORAGE.JS
   Camada única de acesso aos dados (localStorage).
   Nenhum outro arquivo deve chamar localStorage diretamente:
   sempre passe por estas funções. Isso facilita trocar o "banco de dados"
   no futuro (ex: para Supabase) sem reescrever o sistema todo.
   ========================================================================== */

const DB_KEYS = {
  clientes: 'tfl_clientes',
  funcionarios: 'tfl_funcionarios',
  servicos: 'tfl_servicos',
  financeiro: 'tfl_financeiro',
  config: 'tfl_config'
};

/* Configuração padrão (usada apenas na primeira vez que o sistema roda) */
const CONFIG_PADRAO = {
  empresa: {
    nome: 'Toque Final Limpeza',
    telefone: '',
    endereco: ''
  },
  precos: {
    valorM2: null,        // R$ por m² (null = não configurado ainda)
    valorComodo: null,    // R$ por cômodo
    valorBanheiro: null,  // R$ por banheiro
    multiplicadores: {    // multiplicador aplicado sobre o valor base, por tipo de limpeza
      padrao: 1,
      pesada: 1.4,
      pos_obra: 1.8
    }
  },
  categoriasDespesas: ['Produtos de limpeza', 'Transporte', 'Pagamento a funcionários', 'Outras despesas'],
  categoriasReceitas: ['Serviço de limpeza', 'Outras receitas']
};

function _read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler do localStorage:', key, e);
    return fallback;
  }
}

function _write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', key, e);
    return false;
  }
}

/* Gera um ID único simples baseado em tempo + aleatório */
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* Garante que todas as chaves existam no localStorage (roda uma vez no início) */
function inicializarStorage() {
  if (localStorage.getItem(DB_KEYS.clientes) === null) _write(DB_KEYS.clientes, []);
  if (localStorage.getItem(DB_KEYS.funcionarios) === null) _write(DB_KEYS.funcionarios, []);
  if (localStorage.getItem(DB_KEYS.servicos) === null) _write(DB_KEYS.servicos, []);
  if (localStorage.getItem(DB_KEYS.financeiro) === null) _write(DB_KEYS.financeiro, []);
  if (localStorage.getItem(DB_KEYS.config) === null) _write(DB_KEYS.config, CONFIG_PADRAO);
}

/* ---------------- CLIENTES ---------------- */
const ClientesDB = {
  listar() { return _read(DB_KEYS.clientes, []); },
  buscarPorId(id) { return this.listar().find(c => c.id === id) || null; },
  salvar(cliente) {
    const lista = this.listar();
    if (cliente.id) {
      const idx = lista.findIndex(c => c.id === cliente.id);
      if (idx >= 0) lista[idx] = cliente;
    } else {
      cliente.id = gerarId();
      cliente.criadoEm = new Date().toISOString();
      lista.push(cliente);
    }
    _write(DB_KEYS.clientes, lista);
    return cliente;
  },
  excluir(id) {
    const lista = this.listar().filter(c => c.id !== id);
    _write(DB_KEYS.clientes, lista);
  }
};

/* ---------------- FUNCIONÁRIOS ---------------- */
const FuncionariosDB = {
  listar() { return _read(DB_KEYS.funcionarios, []); },
  buscarPorId(id) { return this.listar().find(f => f.id === id) || null; },
  salvar(funcionario) {
    const lista = this.listar();
    if (funcionario.id) {
      const idx = lista.findIndex(f => f.id === funcionario.id);
      if (idx >= 0) lista[idx] = funcionario;
    } else {
      funcionario.id = gerarId();
      funcionario.criadoEm = new Date().toISOString();
      lista.push(funcionario);
    }
    _write(DB_KEYS.funcionarios, lista);
    return funcionario;
  },
  excluir(id) {
    const lista = this.listar().filter(f => f.id !== id);
    _write(DB_KEYS.funcionarios, lista);
  }
};

/* ---------------- SERVIÇOS ---------------- */
const ServicosDB = {
  listar() { return _read(DB_KEYS.servicos, []); },
  buscarPorId(id) { return this.listar().find(s => s.id === id) || null; },
  salvar(servico) {
    const lista = this.listar();
    if (servico.id) {
      const idx = lista.findIndex(s => s.id === servico.id);
      if (idx >= 0) lista[idx] = servico;
    } else {
      servico.id = gerarId();
      servico.criadoEm = new Date().toISOString();
      lista.push(servico);
    }
    _write(DB_KEYS.servicos, lista);
    return servico;
  },
  excluir(id) {
    const lista = this.listar().filter(s => s.id !== id);
    _write(DB_KEYS.servicos, lista);
  }
};

/* ---------------- FINANCEIRO ---------------- */
const FinanceiroDB = {
  listar() { return _read(DB_KEYS.financeiro, []); },
  buscarPorId(id) { return this.listar().find(m => m.id === id) || null; },
  salvar(mov) {
    const lista = this.listar();
    if (mov.id) {
      const idx = lista.findIndex(m => m.id === mov.id);
      if (idx >= 0) lista[idx] = mov;
    } else {
      mov.id = gerarId();
      mov.criadoEm = new Date().toISOString();
      lista.push(mov);
    }
    _write(DB_KEYS.financeiro, lista);
    return mov;
  },
  excluir(id) {
    const lista = this.listar().filter(m => m.id !== id);
    _write(DB_KEYS.financeiro, lista);
  }
};

/* ---------------- CONFIGURAÇÕES ---------------- */
const ConfigDB = {
  obter() { return _read(DB_KEYS.config, CONFIG_PADRAO); },
  salvar(config) { _write(DB_KEYS.config, config); return config; }
};
