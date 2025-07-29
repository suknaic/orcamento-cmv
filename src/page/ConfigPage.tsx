import React, { useEffect, useState } from "react";



export default function ConfigPage() {
  const [materiais, setMateriais] = useState<{ nome: string; preco: number }[]>([]);
  const [acabamentos, setAcabamentos] = useState<{ nome: string; preco: number }[]>([]);
  // Carregar dados do banco ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setMateriais(data.materiais || []);
        setAcabamentos(data.acabamentos || []);
      });
  }, []);

  const handleAddMaterial = () => setMateriais([...materiais, { nome: '', preco: 0 }]);
  const handleAddAcabamento = () => setAcabamentos([...acabamentos, { nome: '', preco: 0 }]);

  const handleSave = () => {
    const form = document.getElementById('config-form') as HTMLFormElement | null;
    if (!form) return;
    const novosMateriais = materiais.map((_, idx) => ({
      nome: (form.elements.namedItem(`material-nome-${idx}`) as HTMLInputElement)?.value || '',
      preco: Number((form.elements.namedItem(`material-preco-${idx}`) as HTMLInputElement)?.value) || 0
    }));
    const novosAcabamentos = acabamentos.map((_, idx) => ({
      nome: (form.elements.namedItem(`acabamento-nome-${idx}`) as HTMLInputElement)?.value || '',
      preco: Number((form.elements.namedItem(`acabamento-preco-${idx}`) as HTMLInputElement)?.value) || 0
    }));
    // Salvar no backend
    fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materiais: novosMateriais, acabamentos: novosAcabamentos })
    })
      .then((res) => res.json())
      .then(() => {
        setMateriais(novosMateriais);
        setAcabamentos(novosAcabamentos);
        alert("Configurações salvas!");
      });
  };
  return (
    <form id="config-form">
      <div className="max-w-xl mx-auto bg-white rounded shadow p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Configurações de Orçamento</h2>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Materiais</h3>
          {materiais.map((mat, idx) => (
            <div className="flex gap-2 mb-2 items-center" key={idx}>
              <input
                className="border rounded px-2 py-1 w-1/2"
                defaultValue={mat.nome}
                placeholder="Nome"
                name={`material-nome-${idx}`}
              />
              <div className="relative w-1/2">
                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">R$</span>
                <input
                  className="border rounded pl-8 pr-2 py-1 w-full"
                  type="number"
                  defaultValue={mat.preco}
                  placeholder="Preço"
                  min={0}
                  step={0.01}
                  name={`material-preco-${idx}`}
                />
              </div>
              <button
                type="button"
                className="ml-2 text-red-600 font-bold text-lg px-2"
                title="Remover material"
                onClick={() => setMateriais(materiais.filter((_, i) => i !== idx))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="border px-3 py-1 rounded text-sm font-semibold mt-2"
            type="button"
            onClick={handleAddMaterial}
          >
            + Adicionar Material
          </button>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Acabamentos</h3>
          {acabamentos.map((acab, idx) => (
            <div className="flex gap-2 mb-2 items-center" key={idx}>
              <input
                className="border rounded px-2 py-1 w-1/2"
                defaultValue={acab.nome}
                placeholder="Nome"
                name={`acabamento-nome-${idx}`}
              />
              <input
                className="border rounded px-2 py-1 w-1/2"
                type="number"
                defaultValue={acab.preco}
                placeholder="Preço"
                min={0}
                step={0.01}
                name={`acabamento-preco-${idx}`}
              />
              <button
                type="button"
                className="ml-2 text-red-600 font-bold text-lg px-2"
                title="Remover acabamento"
                onClick={() => setAcabamentos(acabamentos.filter((_, i) => i !== idx))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="border px-3 py-1 rounded text-sm font-semibold mt-2"
            type="button"
            onClick={handleAddAcabamento}
          >
            + Adicionar Acabamento
          </button>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          type="button"
          onClick={handleSave}
        >
          Salvar Configurações
        </button>
      </div>
    </form>
  );
}
