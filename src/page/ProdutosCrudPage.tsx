import { useEffect, useState } from "react";

// Tipos possíveis para seleção
export enum TipoProduto {
  M2 = "m2",
  Unidade = "unidade",
  Milheiro = "milheiro",
  Kit = "kit",
}

const tipos = [
  { value: TipoProduto.M2, label: "Metro quadrado (m²)" },
  { value: TipoProduto.Unidade, label: "Unidade" },
  { value: TipoProduto.Milheiro, label: "Milheiro" },
  { value: TipoProduto.Kit, label: "Kit" },
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
    <div className="max-w-3xl mx-auto bg-card rounded-xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-10 border border-border">
      <h2 className="text-3xl font-extrabold mb-8 text-foreground tracking-tight text-center">Gerenciar Produtos</h2>
      <div className="mb-4">
        <input
          className="border border-border rounded px-3 py-2 w-full focus:ring-2 focus:ring-ring focus:border-ring transition outline-none shadow-sm bg-card text-foreground"
          placeholder="Buscar produto por nome, tipo ou preço..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(1); }}
        />
      </div>
      <form onSubmit={salvarProduto} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-end mb-6">
        <input
          className="border border-border rounded px-3 py-2 w-full sm:w-48 focus:ring-2 focus:ring-ring focus:border-ring transition outline-none shadow-sm bg-card text-foreground"
          name="nome"
          placeholder="Nome do produto"
          value={novo.nome}
          onChange={handleChange}
          required
        />
        <select
          className="border border-border rounded px-3 py-2 w-full sm:w-40 focus:ring-2 focus:ring-ring focus:border-ring transition outline-none shadow-sm bg-card text-foreground"
          name="tipo"
          value={novo.tipo}
          onChange={handleChange}
        >
          {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          className="border border-border rounded px-3 py-2 w-full sm:w-32 focus:ring-2 focus:ring-ring focus:border-ring transition outline-none shadow-sm bg-card text-foreground"
          name="preco"
          type="number"
          min={0}
          step={0.01}
          placeholder="Preço base"
          value={novo.preco}
          onChange={handleChange}
          required
        />
        <button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded shadow-md transition w-full sm:w-auto"
          type="submit"
          disabled={loading}
        >
          {editando ? "Salvar" : "Adicionar"}
        </button>
        {editando && (
          <button
            className="sm:ml-2 text-foreground border border-border bg-secondary hover:bg-secondary/90 px-4 py-2 rounded w-full sm:w-auto transition"
            type="button"
            onClick={() => { setNovo({ id: '', nome: "", tipo: "m2", preco: 0 }); setEditando(null); }}
          >
            Cancelar
          </button>
        )}
      </form>
      <div className="overflow-x-auto rounded-xl border border-border shadow-sm bg-card">
        <table className="min-w-[600px] w-full text-left rounded-xl overflow-hidden text-sm sm:text-base">
          <thead className="sticky top-0 z-10 bg-accent border-b border-border">
            <tr>
              <th className="py-3 px-4 font-bold text-foreground text-base cursor-pointer select-none whitespace-nowrap" onClick={() => handleOrdenar('nome')}>
                Nome
                {ordem.campo === 'nome' && (
                  <span className="ml-1 text-xs">{ordem.direcao === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 font-bold text-foreground text-base cursor-pointer select-none whitespace-nowrap" onClick={() => handleOrdenar('tipo')}>
                Tipo
                {ordem.campo === 'tipo' && (
                  <span className="ml-1 text-xs">{ordem.direcao === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 font-bold text-foreground text-base cursor-pointer select-none whitespace-nowrap" onClick={() => handleOrdenar('preco')}>
                Preço base
                {ordem.campo === 'preco' && (
                  <span className="ml-1 text-xs">{ordem.direcao === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 font-bold text-foreground text-base text-center whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosPaginados.map((p, idx) => (
              <tr
                key={p.id}
                className={
                  `border-b border-border transition-colors ${idx % 2 === 0 ? 'bg-card' : 'bg-accent/50'} hover:bg-accent`
                }
              >
                <td className="py-3 px-4 font-medium text-foreground break-words max-w-[120px] sm:max-w-xs align-middle">{p.nome}</td>
                <td className="px-4 text-foreground break-words max-w-[80px] sm:max-w-xs align-middle">{p.tipo || "unidade"}</td>
                <td className="px-4 text-green-600 font-bold whitespace-nowrap align-middle">R$ {Number(p.preco).toLocaleString("pt-BR", {minimumFractionDigits:2})}</td>
                <td className="px-4 text-center align-middle">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
                  <button
                    className="inline-flex items-center justify-center text-primary hover:bg-accent rounded-full p-2 mr-0 sm:mr-2 transition"
                    title="Editar"
                    onClick={() => editarProduto(p)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z" />
                    </svg>
                  </button>
                  <button
                    className="inline-flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full p-2 transition"
                    title="Remover"
                    onClick={() => removerProdutoPorId(p.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Paginação */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-4">
          <button
            className="px-3 py-1 rounded border border-border bg-card text-foreground font-semibold disabled:opacity-50"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >Anterior</button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pag => (
            <button
              key={pag}
              className={`px-3 py-1 rounded border ${pagina === pag ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'} font-semibold border-border`}
              onClick={() => setPagina(pag)}
            >{pag}</button>
          ))}
          <button
            className="px-3 py-1 rounded border border-border bg-card text-foreground font-semibold disabled:opacity-50"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >Próxima</button>
        </div>
      </div>
    </div>
  );
}
