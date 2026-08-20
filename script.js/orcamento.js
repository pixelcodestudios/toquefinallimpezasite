/* ==========================================================================
   ORCAMENTO.JS — Calculadora de orçamento
   Só calcula um valor sugerido se os preços tiverem sido configurados
   em Configurações. Nenhum preço é inventado pelo sistema.
   ========================================================================== */

const Orcamento = {
  render() {
    const config = ConfigDB.obter();
    const precosConfigurados = config.precos.valorM2 || config.precos.valorComodo || config.precos.valorBanheiro;
    const aviso = document.getElementById('orcamento-aviso-precos');

    if (!precosConfigurados) {
      aviso.style.display = 'flex';
      aviso.innerHTML = `⚠️ Você ainda não configurou os preços do orçamento.
        <a href="#configuracoes" class="link" data-secao="configuracoes" onclick="navegarPara('configuracoes')">Configurar agora</a>`;
    } else {
      aviso.style.display = 'none';
    }

    document.getElementById('resultado-orcamento').innerHTML = '';
  },

  calcular(event) {
    event.preventDefault();
    const config = ConfigDB.obter();
    const precos = config.precos;

    if (!precos.valorM2 && !precos.valorComodo && !precos.valorBanheiro) {
      mostrarToast('Configure os preços em "Configurações" antes de calcular um orçamento.', 'erro');
      return;
    }

    const tamanho = parseFloat(document.getElementById('orc-tamanho').value) || 0;
    const comodos = parseInt(document.getElementById('orc-comodos').value) || 0;
    const banheiros = parseInt(document.getElementById('orc-banheiros').value) || 0;
    const tipoLimpeza = document.getElementById('orc-tipo-limpeza').value;
    const tipoImovel = document.getElementById('orc-tipo-imovel').value;

    let valorBase = 0;
    let detalhes = [];

    if (precos.valorM2 && tamanho > 0) {
      const parcela = tamanho * precos.valorM2;
      valorBase += parcela;
      detalhes.push(`${tamanho} m² × ${formatarMoeda(precos.valorM2)} = ${formatarMoeda(parcela)}`);
    }
    if (precos.valorComodo && comodos > 0) {
      const parcela = comodos * precos.valorComodo;
      valorBase += parcela;
      detalhes.push(`${comodos} cômodo(s) × ${formatarMoeda(precos.valorComodo)} = ${formatarMoeda(parcela)}`);
    }
    if (precos.valorBanheiro && banheiros > 0) {
      const parcela = banheiros * precos.valorBanheiro;
      valorBase += parcela;
      detalhes.push(`${banheiros} banheiro(s) × ${formatarMoeda(precos.valorBanheiro)} = ${formatarMoeda(parcela)}`);
    }

    if (valorBase === 0) {
      mostrarToast('Preencha ao menos um campo com preço configurado (m², cômodos ou banheiros).', 'erro');
      return;
    }

    const multiplicador = precos.multiplicadores[tipoLimpeza] || 1;
    const valorFinal = valorBase * multiplicador;

    const resultado = document.getElementById('resultado-orcamento');
    resultado.innerHTML = `
      <div class="card-resultado-orcamento">
        <span class="card-resultado-orcamento__rotulo">Valor sugerido</span>
        <span class="card-resultado-orcamento__valor">${formatarMoeda(valorFinal)}</span>
        <div class="card-resultado-orcamento__detalhes">
          <p><strong>Imóvel:</strong> ${escapeHTML(tipoImovel)}</p>
          ${detalhes.map(d => `<p>${d}</p>`).join('')}
          ${multiplicador !== 1 ? `<p><strong>Ajuste por tipo de limpeza (${escapeHTML(tipoLimpeza)}):</strong> ×${multiplicador}</p>` : ''}
        </div>
      </div>`;
  }
};
