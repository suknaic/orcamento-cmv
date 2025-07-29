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
    // Adapta para backend: tipo e preco
    const payload = {
      materiais: [
        ...produtos.filter(p => p.nome !== novo.nome),
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
    setEditando(prod.nome);
  }

  function removerProduto(nome) {
    setLoading(true);
    const payload = {
      materiais: produtos.filter(p => p.nome !== nome),
      acabamentos: [],
    };
    fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(() => setLoading(false));
  }

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
      <table className="w-full text-left border-t">
        <thead>
          <tr className="border-b">
            <th className="py-2">Nome</th>
            <th>Tipo</th>
            <th>Preço base</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-2">{p.nome}</td>
              <td>{p.tipo || "unidade"}</td>
              <td>R$ {Number(p.preco).toLocaleString("pt-BR", {minimumFractionDigits:2})}</td>
              <td>
                <button
                  className="text-blue-600 hover:underline mr-2"
                  onClick={() => editarProduto(p)}
                >Editar</button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => removerProduto(p.nome)}
                >Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
