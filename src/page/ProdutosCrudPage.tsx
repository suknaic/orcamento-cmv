import { useEffect, useState } from "react";
import { Search, Plus, Edit3, Trash2, Package, DollarSign, Tag } from "lucide-react";

// Tipos possíveis para seleção
export enum TipoProduto {
  M2 = "m2",
  Unidade = "unidade",
  Milheiro = "milheiro",
  Kit = "kit",
}

const tipos = [
  { value: TipoProduto.M2, label: "Metro quadrado (m²)", icon: "📐" },
  { value: TipoProduto.Unidade, label: "Unidade", icon: "📦" },
  { value: TipoProduto.Milheiro, label: "Milheiro", icon: "📚" },
  { value: TipoProduto.Kit, label: "Kit", icon: "🎁" },
];

export function ProdutosCrudPage() {
  const [produtos, setProdutos] = useState([]);
  const [novo, setNovo] = useState({ id: '', nome: "", tipo: "m2", preco: 0 });
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ordem, setOrdem] = useState({ campo: 'nome', direcao: 'asc' });
  const [busca, setBusca] = useState("");

  // Carregar produtos do backend (usando /api/config como base)
  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setProdutos(data.materiais || []));
  }, [loading]);

  function handleChange(e) {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  }



  function salvarProduto(e) {
    e.preventDefault();
    setLoading(true);
    let novosMateriais;
    if (editando) {
      // Editando: substitui pelo id
      novosMateriais = produtos.map(p =>
        p.id === novo.id ? { ...novo, preco: Number(novo.preco) } : p
      );
    } else {
      // Adicionando: não gera id, backend deve gerar
      const { id, ...novoSemId } = novo;
      novosMateriais = [
        ...produtos,
        { ...novoSemId, preco: Number(novo.preco) }
      ];
    }
    const payload = {
      materiais: novosMateriais,
      acabamentos: [],
    };
    fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(() => {
      setNovo({ id: '', nome: "", tipo: "m2", preco: 0 });
      setEditando(null);
      setLoading(false);
    });
  }

  function editarProduto(prod) {
    setNovo(prod);
    setEditando(prod.id);
  }

  function removerProdutoPorId(id) {
    setLoading(true);
    const payload = {
      materiais: produtos.filter(p => p.id !== id),
      acabamentos: [],
    };
    fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(() => setLoading(false));
  }

  // Função de ordenação
  function ordenarLista(lista) {
    const { campo, direcao } = ordem;
    return [...lista].sort((a, b) => {
      let vA = a[campo] ?? '';
      let vB = b[campo] ?? '';
      if (campo === 'preco') {
        vA = Number(vA);
        vB = Number(vB);
      } else {
        vA = String(vA).toLowerCase();
        vB = String(vB).toLowerCase();
      }
      if (vA < vB) return direcao === 'asc' ? -1 : 1;
      if (vA > vB) return direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Alterna ordem ao clicar
  function handleOrdenar(campo) {
    setOrdem(ordemAntiga => {
      if (ordemAntiga.campo === campo) {
        return { campo, direcao: ordemAntiga.direcao === 'asc' ? 'desc' : 'asc' };
      }
      return { campo, direcao: 'asc' };
    });
  }

  // Filtro de busca
  const produtosFiltrados = produtos.filter(p => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      (p.nome || "").toLowerCase().includes(termo) ||
      (p.tipo || "").toLowerCase().includes(termo) ||
      String(p.preco).toLowerCase().includes(termo)
    );
  });
  // Paginação
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const produtosOrdenados = ordenarLista(produtosFiltrados);
  const totalPaginas = Math.max(1, Math.ceil(produtosOrdenados.length / porPagina));
  const produtosPaginados = produtosOrdenados.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho da página */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
              <p className="text-muted-foreground">Gerencie seu catálogo de produtos e preços</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário lateral */}
          <div className="lg:col-span-1">
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
                      onClick={() => { 
                        setNovo({ id: '', nome: "", tipo: "m2", preco: 0 }); 
                        setEditando(null); 
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="lg:col-span-2">
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
                        {produtosPaginados.map((p, idx) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}
