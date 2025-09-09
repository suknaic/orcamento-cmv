import { ItemOrcamento } from '../models/orcamento.models';

export class OrcamentoService {

  /**
   * Calcula a quantidade total e o preço total de um item do orçamento
   * com base em seus componentes ou quantidade. A função modifica o objeto 'item' diretamente.
   * @param item O item do orçamento a ser calculado.
   */
  public calcularTotaisItem(item: ItemOrcamento): void {
    if (item.produto.unidadeMedida === 'm2') {
      // Cálculo para produtos medidos por metro quadrado
      let quantidadeTotalCalculada = 0;
      for (const componente of item.componentes) {
        const areaComponente = componente.largura * componente.altura;
        quantidadeTotalCalculada += areaComponente * componente.quantidade;
      }
      item.quantidadeTotal = parseFloat(quantidadeTotalCalculada.toFixed(4));
      item.precoTotal = parseFloat((item.quantidadeTotal * item.produto.precoUnitario).toFixed(2));
    } else {
      // Cálculo para outros tipos (unidade, kit, milheiro, etc.)
      const quantidade = item.quantidade || 1;
      item.quantidadeTotal = quantidade;
      item.precoTotal = parseFloat((quantidade * item.produto.precoUnitario).toFixed(2));
    }
  }
}
