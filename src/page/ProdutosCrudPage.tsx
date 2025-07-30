import React, { useEffect, useState } from "react";

// Tipos possíveis para seleção
const tipos = [
  { value: "m2", label: "Metro quadrado (m²)" },
  { value: "unidade", label: "Unidade" },
  { value: "milheiro", label: "Milheiro" },
  { value: "kit", label: "Kit" },
];

export function ProdutosCrudPage() {
  const [produtos, setProdutos] = useState([]);
  const [novo, setNovo] = useState({ nome: "", tipo: "m2", preco: 0 });
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ordem, setOrdem] = useState({ campo: 'nome', direcao: 'asc' });

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
    // Permite produtos com mesmo nome, mas tipo diferente
    const payload = {
      materiais: [
        ...produtos.filter(p => !(p.nome === novo.nome && p.tipo === novo.tipo)),
        { nome: novo.nome, preco: Number(novo.preco), tipo: novo.tipo }
      ],
      acabamentos: [],
    };
    fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(() => {
      setNovo({ nome: "", tipo: "m2", preco: 0 });
      setEditando(null);
      setLoading(false);
    });
  }

  function editarProduto(prod) {
    setNovo(prod);
    setEditando(prod.nome + '||' + prod.tipo);
  }

  function removerProduto(nome, tipo) {
    setLoading(true);
    const payload = {
      materiais: produtos.filter(p => !(p.nome === nome && p.tipo === tipo)),
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

  const produtosOrdenados = ordenarLista(produtos);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded shadow p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Cadastro de Produtos</h2>
      <form onSubmit={salvarProduto} className="flex gap-2 mb-6 flex-wrap items-end">
        <input
          className="border rounded px-2 py-1"
          name="nome"
          placeholder="Nome do produto"
          value={novo.nome}
          onChange={handleChange}
          required
        />
        <select
          className="border rounded px-2 py-1"
          name="tipo"
          value={novo.tipo}
          onChange={handleChange}
        >
          {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          className="border rounded px-2 py-1"
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          type="submit"
          disabled={loading}
        >
          {editando ? "Salvar" : "Adicionar"}
        </button>
        {editando && (
          <button
            className="ml-2 text-gray-600 border px-3 py-2 rounded"
            type="button"
            onClick={() => { setNovo({ nome: "", tipo: "m2", preco: 0 }); setEditando(null); }}
          >
            Cancelar
          </button>
        )}
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-t rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-blue-50 border-b">
              <th className="py-3 px-4 font-bold text-gray-700 text-base cursor-pointer select-none" onClick={() => handleOrdenar('nome')}>
                Nome
                {ordem.campo === 'nome' && (
                  <span className="ml-1 text-xs">{ordem.direcao === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 font-bold text-gray-700 text-base cursor-pointer select-none" onClick={() => handleOrdenar('tipo')}>
                Tipo
                {ordem.campo === 'tipo' && (
                  <span className="ml-1 text-xs">{ordem.direcao === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 font-bold text-gray-700 text-base cursor-pointer select-none" onClick={() => handleOrdenar('preco')}>
                Preço base
                {ordem.campo === 'preco' && (
                  <span className="ml-1 text-xs">{ordem.direcao === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 font-bold text-gray-700 text-base text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosOrdenados.map((p, idx) => (
              <tr
                key={p.nome + '||' + p.tipo}
                className={
                  `border-b transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`
                }
              >
                <td className="py-3 px-4 text-md font-medium text-gray-800 whitespace-nowrap">{p.nome}</td>
                <td className="px-4 text-gray-700 whitespace-nowrap">{p.tipo || "unidade"}</td>
                <td className="px-4 text-green-700 font-semibold whitespace-nowrap">R$ {Number(p.preco).toLocaleString("pt-BR", {minimumFractionDigits:2})}</td>
                <td className="px-4 text-center">
                  <button
                    className="inline-flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded-full p-2 mr-2 transition"
                    title="Editar"
                    onClick={() => editarProduto(p)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z" />
                    </svg>
                  </button>
                  <button
                    className="inline-flex items-center justify-center text-red-600 hover:bg-red-100 rounded-full p-2 transition"
                    title="Remover"
                    onClick={() => removerProduto(p.nome, p.tipo)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
