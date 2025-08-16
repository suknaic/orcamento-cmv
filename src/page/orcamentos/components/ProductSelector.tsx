import React from 'react';
import { useOrcamentoContext } from '../contexts/OrcamentoContext';

interface ProductSelectorProps {
  produtoIndex: number;
}

export function ProductSelector({ produtoIndex }: ProductSelectorProps) {
  const { 
    produtos, 
    setProdutos, 
    materiais, 
    materialRefs,
    removerProduto 
  } = useOrcamentoContext();

  const produto = produtos[produtoIndex];

  const tiposMateriais = {
    m2: { campos: ["largura", "altura", "quantidade"] },
    unidade: { campos: ["quantidade"] },
    milheiro: { campos: ["quantidade"] },
    kit: { campos: ["quantidade"] },
  };

  const calcularOrcamento = (material: any, tipo: string, preco: number, largura: string, altura: string, quantidade: number) => {
    if (!material || !tipo) return 0;

    const precoNum = parseFloat(String(preco).replace(",", ".")) || 0;
    const larguraNum = parseFloat(String(largura).replace(",", ".")) || 0;
    const alturaNum = parseFloat(String(altura).replace(",", ".")) || 0;
    const quantidadeNum = Math.max(1, parseInt(String(quantidade)) || 1);

    if (tipo === "m2") {
      const area = larguraNum * alturaNum;
      return area * precoNum * quantidadeNum;
    }
    if (tipo === "unidade") {
      return precoNum * quantidadeNum;
    }
    if (tipo === "milheiro") {
      return precoNum * quantidadeNum;
    }
    if (tipo === "kit") {
      return precoNum * quantidadeNum;
    }
    return 0;
  };

  const atualizarProduto = (campo: string, valor: any) => {
    setProdutos(produtos =>
      produtos.map((prod, i) => {
        if (i === produtoIndex) {
          const novoProd = { ...prod, [campo]: valor };
          
          // Se mudou o material, atualiza tipo e preço
          if (campo === 'materialSelecionado') {
            const mat = materiais.find((m) => m.nome === valor);
            if (mat) {
              novoProd.tipo = mat.tipo || "unidade";
              novoProd.preco = mat.preco;
            }
          }

          // Recalcula o valor
          novoProd.valor = calcularOrcamento(
            novoProd.materialSelecionado,
            novoProd.tipo,
            novoProd.preco,
            novoProd.largura,
            novoProd.altura,
            novoProd.quantidade
          );

          return novoProd;
        }
        return prod;
      })
    );
  };

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-5 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
          {produtoIndex + 1}
        </div>
        <h3 className="font-semibold text-foreground">
          Produto {produtoIndex + 1}
        </h3>
        {produtos.length > 1 && (
          <button
            type="button"
            className="ml-auto text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg p-2 transition-colors"
            title="Remover produto"
            onClick={() => removerProduto(produtoIndex)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Campo de Produto */}
        <div className="lg:col-span-2">
          <label className="flex items-center gap-2 mb-2 font-medium text-foreground">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Nome do Produto *
          </label>
          <div className="relative">
            <input
              ref={(el) => {
                materialRefs.current[produtoIndex] = el;
              }}
              type="text"
              className="border border-input rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-ring focus:border-ring transition-colors outline-none bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Digite ou busque um produto..."
              value={produto._buscaMaterial || ""}
              onChange={(e) => {
                atualizarProduto('_buscaMaterial', e.target.value);
              }}
              onFocus={() => {
                if (!produto._showDropdown) {
                  atualizarProduto('_showDropdown', true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  atualizarProduto('_showDropdown', false);
                }, 150);
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              tabIndex={-1}
              onClick={() => atualizarProduto('_showDropdown', !produto._showDropdown)}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {produto._showDropdown && (
              <div className="absolute z-30 left-0 right-0 bg-popover border border-border rounded-b-lg shadow-xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                {materiais.filter((mat) => {
                  const busca = (produto._buscaMaterial || "").toLowerCase();
                  return !busca || mat.nome.toLowerCase().includes(busca);
                }).length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      Nenhum produto encontrado
                    </p>
                  </div>
                ) : (
                  materiais
                    .filter((mat) => {
                      const busca = (produto._buscaMaterial || "").toLowerCase();
                      return !busca || mat.nome.toLowerCase().includes(busca);
                    })
                    .map((mat) => (
                      <button
                        type="button"
                        key={`material-${produtoIndex}-${mat.nome}`}
                        className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3 border-b border-border last:border-b-0 ${
                          produto.materialSelecionado === mat.nome
                            ? "bg-accent/50 border-primary/20"
                            : ""
                        }`}
                        onClick={() => {
                          atualizarProduto('materialSelecionado', mat.nome);
                          atualizarProduto('_buscaMaterial', mat.nome);
                          atualizarProduto('_showDropdown', false);
                          atualizarProduto('largura', '');
                          atualizarProduto('altura', '');
                          atualizarProduto('quantidade', 1);
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground truncate" title={mat.nome}>
                            {mat.nome}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="bg-muted px-2 py-1 rounded-full">
                              {mat.tipo || "unidade"}
                            </span>
                          </div>
                        </div>
                        {mat.preco && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              R$ {Number(mat.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        )}
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Campos de Dimensões */}
        {produto.tipo && tiposMateriais[produto.tipo as keyof typeof tiposMateriais]?.campos.includes("largura") && (
          <div>
            <label className="flex items-center gap-2 mb-2 font-medium text-foreground">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"
                />
              </svg>
              Largura (m)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="border border-input rounded-lg px-3 py-3 w-full text-foreground bg-background focus:ring-2 focus:ring-ring focus:border-ring transition-colors outline-none"
              placeholder="0,00"
              value={produto.largura}
              onChange={(e) => atualizarProduto('largura', e.target.value)}
            />
          </div>
        )}

        {produto.tipo && tiposMateriais[produto.tipo as keyof typeof tiposMateriais]?.campos.includes("altura") && (
          <div>
            <label className="flex items-center gap-2 mb-2 font-medium text-foreground">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"
                />
              </svg>
              Altura (m)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="border border-input rounded-lg px-3 py-3 w-full text-foreground bg-background focus:ring-2 focus:ring-ring focus:border-ring transition-colors outline-none"
              placeholder="0,00"
              value={produto.altura}
              onChange={(e) => atualizarProduto('altura', e.target.value)}
            />
          </div>
        )}

        {produto.tipo && tiposMateriais[produto.tipo as keyof typeof tiposMateriais]?.campos.includes("quantidade") && (
          <div>
            <label className="flex items-center gap-2 mb-2 font-medium text-foreground">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
              Quantidade
            </label>
            <input
              type="number"
              min={1}
              step={1}
              className="border border-input rounded-lg px-3 py-3 w-full text-foreground bg-background focus:ring-2 focus:ring-ring focus:border-ring transition-colors outline-none"
              placeholder="1"
              value={produto.quantidade}
              onChange={(e) => atualizarProduto('quantidade', Number(e.target.value))}
            />
          </div>
        )}

        {/* Subtotal */}
        <div>
          <label className="flex items-center gap-2 mb-2 font-medium text-foreground">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            Subtotal
          </label>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-primary/20 rounded-lg px-4 py-4 text-center">
            <div className="text-3xl font-bold text-primary">
              R$ {produto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            {produto.quantidade > 1 && produto.valor > 0 && (
              <div className="text-sm text-primary/80 mt-1">
                R$ {(produto.valor / produto.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                por {produto.tipo === "m2" ? "m²" : "unidade"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
