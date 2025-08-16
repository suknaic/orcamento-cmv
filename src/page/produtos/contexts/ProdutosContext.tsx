import React, { createContext, useContext, useState, useEffect } from "react";

// Tipos possíveis para seleção
export enum TipoProduto {
  M2 = "m2",
  Unidade = "unidade",
  Milheiro = "milheiro",
  Kit = "kit",
}

export const tipos = [
  { value: TipoProduto.M2, label: "Metro quadrado (m²)", icon: "📐" },
  { value: TipoProduto.Unidade, label: "Unidade", icon: "📦" },
  { value: TipoProduto.Milheiro, label: "Milheiro", icon: "📚" },
  { value: TipoProduto.Kit, label: "Kit", icon: "🎁" },
];

interface Produto {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
}

interface ProdutosContextType {
  // Estados principais
  produtos: Produto[];
  novo: Produto;
  editando: string | null;
  loading: boolean;
  ordem: { campo: string; direcao: 'asc' | 'desc' };
  busca: string;
  pagina: number;
  porPagina: number;
  
  // Estados derivados
  produtosFiltrados: Produto[];
  produtosOrdenados: Produto[];
  produtosPaginados: Produto[];
  totalPaginas: number;
  
  // Funções
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  salvarProduto: (e: React.FormEvent) => void;
  editarProduto: (produto: Produto) => void;
  removerProdutoPorId: (id: string) => void;
  handleOrdenar: (campo: string) => void;
  setBusca: (busca: string) => void;
  setPagina: (pagina: number | ((prev: number) => number)) => void;
  cancelarEdicao: () => void;
}

const ProdutosContext = createContext<ProdutosContextType | undefined>(undefined);

export function useProdutosContext() {
  const context = useContext(ProdutosContext);
  if (!context) {
    throw new Error("useProdutosContext deve ser usado dentro de ProdutosProvider");
  }
  return context;
}

export function ProdutosProvider({ children }: { children: React.ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [novo, setNovo] = useState<Produto>({ id: '', nome: "", tipo: "m2", preco: 0 });
  const [editando, setEditando] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordem, setOrdem] = useState({ campo: 'nome', direcao: 'asc' as 'asc' | 'desc' });
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  // Carregar produtos do backend
  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setProdutos(data.materiais || []));
  }, [loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  };

  const salvarProduto = (e: React.FormEvent) => {
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
  };

  const editarProduto = (prod: Produto) => {
    setNovo(prod);
    setEditando(prod.id);
  };

  const removerProdutoPorId = (id: string) => {
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
  };

  const cancelarEdicao = () => {
    setNovo({ id: '', nome: "", tipo: "m2", preco: 0 });
    setEditando(null);
  };

  // Função de ordenação
  const ordenarLista = (lista: Produto[]) => {
    const { campo, direcao } = ordem;
    return [...lista].sort((a, b) => {
      let vA: any = a[campo as keyof Produto] ?? '';
      let vB: any = b[campo as keyof Produto] ?? '';
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
  };

  // Alterna ordem ao clicar
  const handleOrdenar = (campo: string) => {
    setOrdem(ordemAntiga => {
      if (ordemAntiga.campo === campo) {
        return { campo, direcao: ordemAntiga.direcao === 'asc' ? 'desc' : 'asc' };
      }
      return { campo, direcao: 'asc' };
    });
  };

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

  // Estados derivados
  const produtosOrdenados = ordenarLista(produtosFiltrados);
  const totalPaginas = Math.max(1, Math.ceil(produtosOrdenados.length / porPagina));
  const produtosPaginados = produtosOrdenados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const value: ProdutosContextType = {
    // Estados principais
    produtos,
    novo,
    editando,
    loading,
    ordem,
    busca,
    pagina,
    porPagina,
    
    // Estados derivados
    produtosFiltrados,
    produtosOrdenados,
    produtosPaginados,
    totalPaginas,
    
    // Funções
    handleChange,
    salvarProduto,
    editarProduto,
    removerProdutoPorId,
    handleOrdenar,
    setBusca,
    setPagina,
    cancelarEdicao,
  };

  return (
    <ProdutosContext.Provider value={value}>
      {children}
    </ProdutosContext.Provider>
  );
}
