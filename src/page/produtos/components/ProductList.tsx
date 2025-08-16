import React from "react";
import { Search, Edit3, Trash2, Package } from "lucide-react";
import { useProdutosContext, tipos } from "../contexts/ProdutosContext";

export function ProductList() {
  const {
    produtosFiltrados,
    produtosPaginados,
    busca,
    setBusca,
    setPagina,
    ordem,
    handleOrdenar,
    editarProduto,
    removerProdutoPorId,
    totalPaginas,
    pagina,
    porPagina,
    produtosOrdenados
  } = useProdutosContext();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      {/* Cabeçalho da lista */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Produtos Cadastrados</h3>
            <p className="text-sm text-muted-foreground">
              {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Campo de busca */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none placeholder:text-muted-foreground"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1); }}
            />
          </div>
        </div>
      </div>

      {/* Tabela de produtos */}
      {produtosPaginados.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-sm font-medium text-foreground cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    onClick={() => handleOrdenar('nome')}
                  >
                    <div className="flex items-center gap-2">
                      Produto
                      {ordem.campo === 'nome' && (
                        <span className="text-primary">{ordem.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-medium text-foreground cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    onClick={() => handleOrdenar('tipo')}
                  >
                    <div className="flex items-center gap-2">
                      Unidade
                      {ordem.campo === 'tipo' && (
                        <span className="text-primary">{ordem.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-medium text-foreground cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    onClick={() => handleOrdenar('preco')}
                  >
                    <div className="flex items-center gap-2">
                      Preço Base
                      {ordem.campo === 'preco' && (
                        <span className="text-primary">{ordem.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {produtosPaginados.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{p.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tipos.find(t => t.value === p.tipo)?.icon || "📦"}</span>
                        <span className="text-sm text-muted-foreground">
                          {tipos.find(t => t.value === p.tipo)?.label || p.tipo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-primary">
                        R$ {Number(p.preco).toLocaleString("pt-BR", {minimumFractionDigits:2})}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors group-hover:opacity-100 opacity-60"
                          title="Editar produto"
                          onClick={() => editarProduto(p)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors group-hover:opacity-100 opacity-60"
                          title="Remover produto"
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja remover "${p.nome}"?`)) {
                              removerProdutoPorId(p.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((pagina - 1) * porPagina) + 1} a {Math.min(pagina * porPagina, produtosOrdenados.length)} de {produtosOrdenados.length} produtos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                  >
                    Anterior
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (pagina <= 3) {
                        pageNum = i + 1;
                      } else if (pagina >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = pagina - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                            pagina === pageNum 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-foreground hover:bg-muted/50'
                          }`}
                          onClick={() => setPagina(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="px-3 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="px-6 py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {busca ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {busca 
              ? "Tente ajustar os termos da sua busca" 
              : "Comece adicionando seu primeiro produto usando o formulário ao lado"
            }
          </p>
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Limpar busca
            </button>
          )}
        </div>
      )}
    </div>
  );
}
