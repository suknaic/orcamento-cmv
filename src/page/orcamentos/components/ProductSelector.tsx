import React, { useEffect } from 'react';
import { useOrcamentoContext, type ItemOrcamentoUI } from '../contexts/OrcamentoContext';
import type { ComponenteItem } from '@/lib/models/orcamento.models';

interface ProductSelectorProps {
  produtoIndex: number;
}

// Subcomponente para gerenciar os componentes de um item
function ComponenteEditor({ item, itemIndex, atualizarItem }: { item: ItemOrcamentoUI, itemIndex: number, atualizarItem: (campo: string, valor: any) => void }) {
  const { orcamentoService, setProdutos } = useOrcamentoContext();

  const adicionarComponente = () => {
    const novoComponente: ComponenteItem = {
      id: Date.now(),
      descricao: `Medida ${item.componentes.length + 1}`,
      largura: 0,
      altura: 0,
      quantidade: 1,
    };
    const novosComponentes = [...item.componentes, novoComponente];
    atualizarItem('componentes', novosComponentes);
  };

  const removerComponente = (componenteId: number) => {
    const novosComponentes = item.componentes.filter(c => c.id !== componenteId);
    atualizarItem('componentes', novosComponentes);
  };

  const atualizarComponente = (componenteId: number, campo: keyof ComponenteItem, valor: any) => {
    const novosComponentes = item.componentes.map(c => {
      if (c.id === componenteId) {
        // Converte para número se for largura, altura ou quantidade
        const valorNumerico = ['largura', 'altura', 'quantidade'].includes(campo)
          ? parseFloat(String(valor).replace(',', '.')) || 0
          : valor;
        return { ...c, [campo]: valorNumerico };
      }
      return c;
    });
    atualizarItem('componentes', novosComponentes);
  };

  // Efeito para recalcular totais quando os componentes mudam
  useEffect(() => {
    // Usamos uma flag para evitar loops infinitos
    let skip = false;
    
    // Não fazemos nada se não tiver componentes para evitar cálculos desnecessários
    if (item.componentes.length === 0 && item.produto.unidadeMedida !== 'm2') {
      return;
    }
    
    // Verificamos se realmente precisamos recalcular
    const precisaRecalcular = item.componentes.some(c => 
      c.largura > 0 && c.altura > 0 && c.quantidade > 0
    ) || item.produto.precoUnitario > 0;
    
    if (precisaRecalcular) {
      setProdutos(produtos => {
        // Evitamos alterações aninhadas de estado
        if (skip) return produtos;
        
        // Criamos um novo array para evitar mutações do estado original
        return produtos.map((p, idx) => {
          if (idx === itemIndex) {
            const itemAtualizado = { ...p };
            // Calculamos os totais sem modificar o estado dentro do setProdutos
            orcamentoService.calcularTotaisItem(itemAtualizado);
            return itemAtualizado;
          }
          return p;
        });
      });
    }
    
    // Cleanup para evitar atualizações após desmontagem
    return () => {
      skip = true;
    };
  }, [item.componentes, item.produto.precoUnitario, itemIndex, setProdutos, orcamentoService, item.produto.unidadeMedida]);


  return (
    <div className="mt-4 space-y-3 pl-8 border-l-2 border-dashed border-border ml-4">
      {item.componentes.map((componente) => (
        <div key={componente.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-background/50 p-2 rounded-md">
          <div className="md:col-span-4">
            <input
              type="text"
              className="border border-input rounded-md px-2 py-1.5 w-full text-sm"
              placeholder="Descrição (ex: Frente)"
              value={componente.descricao}
              onChange={(e) => atualizarComponente(componente.id, 'descricao', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min={0}
              step={0.01}
              className="border border-input rounded-md px-2 py-1.5 w-full text-sm"
              placeholder="Largura"
              value={componente.largura}
              onChange={(e) => atualizarComponente(componente.id, 'largura', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min={0}
              step={0.01}
              className="border border-input rounded-md px-2 py-1.5 w-full text-sm"
              placeholder="Altura"
              value={componente.altura}
              onChange={(e) => atualizarComponente(componente.id, 'altura', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min={1}
              step={1}
              className="border border-input rounded-md px-2 py-1.5 w-full text-sm"
              placeholder="Qtd"
              value={componente.quantidade}
              onChange={(e) => atualizarComponente(componente.id, 'quantidade', e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="button"
              className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md p-1.5"
              title="Remover medida"
              onClick={() => removerComponente(componente.id)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="w-full border border-dashed border-input rounded-lg py-2 text-sm text-muted-foreground hover:bg-muted hover:border-primary/30"
        onClick={adicionarComponente}
      >
        + Adicionar Medida
      </button>
    </div>
  );
}


export function ProductSelector({ produtoIndex }: ProductSelectorProps) {
  const { 
    produtos, 
    setProdutos, 
    materiais, 
    materialRefs,
    removerProduto,
    orcamentoService
  } = useOrcamentoContext();

  const produtoItem = produtos[produtoIndex];

  const atualizarItem = (campo: keyof ItemOrcamentoUI, valor: any) => {
    setProdutos(produtosAtuais =>
      produtosAtuais.map((item, i) => {
        if (i === produtoIndex) {
          const novoItem = { ...item, [campo]: valor };
          
          // Se mudou o material, atualiza o produto base
          if (campo === '_buscaMaterial') {
            const mat = materiais.find((m) => m.nome === valor);
            if (mat) {
              novoItem.produto = {
                id: mat.id, // Supondo que o material tenha um ID
                nome: mat.nome,
                unidadeMedida: mat.tipo || 'm2',
                precoUnitario: mat.preco || 0,
              };
              // Limpa componentes se o tipo de medida não for m2
              if (novoItem.produto.unidadeMedida !== 'm2') {
                novoItem.componentes = [];
              }
            }
          }

          // Recalcula o valor total do item
          if (campo === 'quantidade' && novoItem.produto.unidadeMedida !== 'm2') {
            novoItem.quantidade = Number(valor) || 1;
          }
          
          orcamentoService.calcularTotaisItem(novoItem);

          return novoItem;
        }
        return item;
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

        

        <div className="lg:col-span-3">
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
              value={produtoItem._buscaMaterial || ""}
              onChange={(e) => {
                atualizarItem('_buscaMaterial', e.target.value);
                atualizarItem('_showDropdown', true);
              }}
              onFocus={() => {
                if (!produtoItem._showDropdown) {
                  atualizarItem('_showDropdown', true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  atualizarItem('_showDropdown', false);
                }, 150);
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              tabIndex={-1}
              onClick={() => atualizarItem('_showDropdown', !produtoItem._showDropdown)}
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
            {produtoItem._showDropdown && (
              <div className="absolute z-30 left-0 right-0 bg-popover border border-border rounded-b-lg shadow-xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                {materiais.filter((mat) => {
                  const busca = (produtoItem._buscaMaterial || "").toLowerCase();
                  return !busca || mat.nome.toLowerCase().includes(busca) || mat.nome === produtoItem.produto.nome;
                }).length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      Nenhum produto encontrado
                    </p>
                  </div>
                ) : (
                  materiais
                    .filter((mat) => {
                      const busca = (produtoItem._buscaMaterial || "").toLowerCase();
                      return !busca || mat.nome.toLowerCase().includes(busca) || mat.nome === produtoItem.produto.nome;
                    })
                    .map((mat) => (
                      <button
                        type="button"
                        key={`material-${produtoIndex}-${mat.nome}`}
                        className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3 border-b border-border last:border-b-0 ${
                          produtoItem.produto.nome === mat.nome
                            ? "bg-accent/50 border-primary/20"
                            : ""
                        }`}
                        onClick={() => {
                          atualizarItem('_buscaMaterial', mat.nome);
                          atualizarItem('_showDropdown', false);
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
                            <div className="text-lg font-bold ">
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
          
            {produtoItem.produto.unidadeMedida === 'm2' && (
              <ComponenteEditor 
                item={produtoItem}
                itemIndex={produtoIndex}
                atualizarItem={atualizarItem}
              />
            )}


        </div>

        {/* Campo de Quantidade para não-m2 */}
        {produtoItem.produto.unidadeMedida !== 'm2' && (
          <div className="lg:col-span-1">
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
              value={produtoItem.quantidade}
              onChange={(e) => atualizarItem('quantidade', e.target.value)}
            />
          </div>
        )}

        {/* Subtotal */}
        <div className="lg:col-span-1 flex flex-col h-full">
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
          <div className="flex-1 flex flex-col justify-center bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-primary/20 rounded-lg px-4 py-4 text-center min-h-[90px]">
            <div className="text-3xl font-bold text-primary break-words">
              R$ {produtoItem.precoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            {produtoItem.quantidadeTotal > 0 && (
              <div className="text-sm text-primary/80 mt-1 break-words">
          {produtoItem.produto.unidadeMedida === 'm2'
            ? `${produtoItem.quantidadeTotal.toFixed(2)} m²`
            : `${produtoItem.quantidadeTotal} ${produtoItem.produto.unidadeMedida}(s)`
          }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor de Componentes */}
      
    </div>
  );
}
