/**
 * Representa a definição base de um produto.
 * Ex: Adesivo, Chapa de MDF, etc.
 */
export interface Produto {
  id: number;
  nome: string;
  unidadeMedida: 'm2' | 'un' | 'm'; // Metro quadrado, unidade, metro linear
  precoUnitario: number; // Preço por unidade de medida (ex: preço por m²)
}

/**
 * Representa um componente ou uma medida específica de um Item do Orçamento.
 * Ex: Lado 1 da porta, Frente da gaveta.
 */
export interface ComponenteItem {
  id: number;
  descricao: string; // Ex: "Lado 1 da Porta"
  largura: number;   // em metros
  altura: number;    // em metros
  quantidade: number; // Quantas peças com essa medida? Geralmente 1.
}

/**
 * Representa o item principal no orçamento.
 * A sua quantidade e preço total são calculados a partir da soma de seus componentes.
 */
export interface ItemOrcamento {
  id: number;
  produto: Produto; // O produto base (ex: Adesivo)
  componentes: ComponenteItem[]; // Lista de medidas/sub-produtos
  quantidade?: number; // Usado para tipos 'unidade', 'kit', etc.
  quantidadeTotal: number; // Calculado: soma das áreas ou a quantidade
  precoTotal: number; // Calculado: quantidadeTotal * produto.precoUnitario
}
