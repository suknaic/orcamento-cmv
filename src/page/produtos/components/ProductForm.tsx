import React from "react";
import { Plus, Edit3, Tag, DollarSign } from "lucide-react";
import { useProdutosContext, tipos } from "../contexts/ProdutosContext";

export function ProductForm() {
  const {
    novo,
    editando,
    loading,
    handleChange,
    salvarProduto,
    cancelarEdicao
  } = useProdutosContext();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6 sticky top-6">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          {editando ? "Editar Produto" : "Novo Produto"}
        </h2>
      </div>
      
      <form onSubmit={salvarProduto} className="space-y-4">
        {/* Campo Nome */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Tag className="w-4 h-4" />
            Nome do Produto
          </label>
          <input
            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none placeholder:text-muted-foreground"
            name="nome"
            placeholder="Ex: Tinta látex premium"
            value={novo.nome}
            onChange={handleChange}
            required
          />
        </div>

        {/* Campo Tipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            Unidade de Medida
          </label>
          <select
            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none"
            name="tipo"
            value={novo.tipo}
            onChange={handleChange}
          >
            {tipos.map(t => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campo Preço */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <DollarSign className="w-4 h-4" />
            Preço Base
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <input
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none placeholder:text-muted-foreground"
              name="preco"
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              value={novo.preco}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-4">
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : editando ? (
              <>
                <Edit3 className="w-4 h-4" />
                Salvar Alterações
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Adicionar Produto
              </>
            )}
          </button>
          
          {editando && (
            <button
              className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg border border-border transition-colors"
              type="button"
              onClick={cancelarEdicao}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
