import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";


// Tipos de materiais e lógica de cálculo
const tiposMateriais = {
  "m2": { campos: ["largura", "altura", "quantidade"] },
  "unidade": { campos: ["quantidade"] },
  "milheiro": { campos: ["quantidade"] },
  "kit": { campos: ["quantidade"] },
};

function calcularOrcamento(material, tipo, preco, largura, altura, quantidade) {
  if (!material || !tipo) return 0;
  if (tipo === "m2") {
    const area = (Number(largura) * Number(altura)) || 0;
    return area * preco * (quantidade || 1);
  }
  if (tipo === "unidade") {
    return preco * (quantidade || 1);
  }
  if (tipo === "milheiro") {
    return preco * ((quantidade || 0) / 1000);
  }
  if (tipo === "kit") {
    return preco * (quantidade || 1);
  }
  return 0;
}


export function OrcamentoPage() {
  const [contatos, setContatos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [contatosSelecionados, setContatosSelecionados] = useState([]);
  const [buscaContato, setBuscaContato] = useState("");


  const [materiais, setMateriais] = useState([]);
  const [materialSelecionado, setMaterialSelecionado] = useState(null);
  const [tipo, setTipo] = useState("");
  const [preco, setPreco] = useState(0);
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valor, setValor] = useState(0);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setMateriais(data.materiais || []);
      });
  }, []);

  useEffect(() => {
    if (!materialSelecionado) return;
    const mat = materiais.find(m => m.nome === materialSelecionado);
    if (!mat) return;
    // Detecta tipo pelo nome (ajuste conforme necessário)
    let tipoDetectado = "unidade";
    if (/m2|acm|lona|adesivo|acrílico/i.test(mat.nome)) tipoDetectado = "m2";
    if (/milheiro/i.test(mat.nome)) tipoDetectado = "milheiro";
    if (/kit/i.test(mat.nome)) tipoDetectado = "kit";
    setTipo(tipoDetectado);
    setPreco(mat.preco);
  }, [materialSelecionado, materiais]);

  useEffect(() => {
    setValor(
      calcularOrcamento(
        materialSelecionado,
        tipo,
        preco,
        largura,
        altura,
        quantidade
      )
    );
  }, [materialSelecionado, tipo, preco, largura, altura, quantidade]);

  useEffect(() => {
    if (!materialSelecionado) return setMensagem("");
    let desc = `${materialSelecionado}`;
    if (tipo === "m2") {
      desc += ` (${largura}x${altura}m`;
      if (quantidade > 1) desc += `, ${quantidade}x`;
      desc += ")";
    } else if (tipo === "milheiro") {
      if (quantidade === 1) {
        desc += ` (1 milheiro)`;
      } else {
        desc += ` (${quantidade} milheiros)`;
      }
    } else if (tipo === "unidade") {
      desc += quantidade === 1 ? ` (1 unidade)` : ` (${quantidade} unidades)`;
    } else if (tipo === "kit") {
      desc += quantidade === 1 ? ` (1 kit)` : ` (${quantidade} kits)`;
    }
    // Data e hora atuais
    const agora = new Date();
    const dataStr = agora.toLocaleDateString("pt-BR");
    const horaStr = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    // Prazo de produção (2 dias úteis)
    function addBusinessDays(date, days) {
      let result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        // 0 = domingo, 6 = sábado
        if (result.getDay() !== 0 && result.getDay() !== 6) {
          added++;
        }
      }
      return result;
    }
    const prazoProducao = 2;
    const previsaoEntrega = addBusinessDays(agora, prazoProducao);
    const previsaoStr = previsaoEntrega.toLocaleDateString("pt-BR");
    setMensagem(
      `Orçamento: ${desc}\nValor estimado: R$${valor.toLocaleString("pt-BR", {minimumFractionDigits:2})}\nValidade: 7 dias\nPrazo de produção: ${prazoProducao} dias úteis\nData: ${dataStr}\nHora: ${horaStr}\nPrevisão para entrega: ${previsaoStr}`
    );
  }, [materialSelecionado, tipo, largura, altura, quantidade, valor]);

  function copiar() {
    navigator.clipboard.writeText(mensagem);
    toast.success("Mensagem copiada!");
  }
  async function enviarWhatsApp() {
    // Busca contatos reais do backend
    const res = await fetch("/api/contatos");
    const lista = await res.json();
    setContatos(lista);
    setShowModal(true);
  }

  async function handleEnviarParaSelecionados() {
    if (contatosSelecionados.length === 0) return;
    try {
      const res = await fetch("/api/enviarMensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeros: contatosSelecionados, mensagem })
      });
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        toast.error("Erro ao processar resposta do servidor. Tente novamente.");
        setShowModal(false);
        return;
      }
      if (data && data.ok) {
        toast.success("Mensagem enviada para os contatos selecionados!");
      } else {
        toast.error("Falha ao enviar mensagem: " + (data?.error || "Erro desconhecido"));
      }
    } catch (e) {
      toast.error("Erro ao enviar mensagem: " + e);
    }
    setShowModal(false);
  }
  function handleCheckContato(numero) {
    setContatosSelecionados(prev =>
      prev.includes(numero)
        ? prev.filter(n => n !== numero)
        : [...prev, numero]
    );
  }



  return (
    <>
      <ToastContainer position="top-center" autoClose={3500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-xl mx-auto bg-white rounded shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Novo Orçamento</h2>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Material</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={materialSelecionado || ""}
            onChange={e => setMaterialSelecionado(e.target.value)}
          >
            <option value="">Selecione...</option>
            {materiais.map((mat, idx) => (
              <option key={idx} value={mat.nome}>{mat.nome}</option>
            ))}
          </select>
        </div>
        {tipo && tiposMateriais[tipo]?.campos.includes("largura") && (
          <div className="mb-2">
            <label className="block mb-1">Largura (m)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="border rounded px-2 py-1 w-full"
              value={largura}
              onChange={e => setLargura(e.target.value)}
            />
          </div>
        )}
        {tipo && tiposMateriais[tipo]?.campos.includes("altura") && (
          <div className="mb-2">
            <label className="block mb-1">Altura (m)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="border rounded px-2 py-1 w-full"
              value={altura}
              onChange={e => setAltura(e.target.value)}
            />
          </div>
        )}
        {tipo && tiposMateriais[tipo]?.campos.includes("quantidade") && (
          <div className="mb-2">
            <label className="block mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              step={1}
              className="border rounded px-2 py-1 w-full"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
            />
          </div>
        )}
        <div className="mb-4 mt-4">
          <span className="font-semibold">Valor estimado: </span>
          <span className="text-lg text-green-700 font-bold">R${valor.toLocaleString("pt-BR", {minimumFractionDigits:2})}</span>
        </div>
        <div className="mb-4">
          <textarea
            className="border rounded px-2 py-1 w-full text-sm"
            rows={4}
            value={mensagem}
            readOnly
          />
        </div>
        <div className="flex gap-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded font-semibold"
            type="button"
            onClick={copiar}
          >
            Copiar orçamento
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
            type="button"
            onClick={enviarWhatsApp}
          >
            Enviar para WhatsApp
          </button>
        </div>

        {/* Modal de seleção de contatos */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-8 max-w-md w-full relative">
              <h3 className="text-xl font-bold mb-4">Selecione os contatos para envio</h3>
              <input
                className="border rounded px-2 py-1 w-full mb-4"
                placeholder="Buscar por nome ou telefone..."
                value={buscaContato}
                onChange={e => setBuscaContato(e.target.value)}
                autoFocus
              />
              <div className="flex flex-col gap-2 mb-4 max-h-60 overflow-y-auto">
                {contatos.length === 0 ? (
                  <span className="text-gray-500">Nenhum contato encontrado.</span>
                ) : contatos
                  .filter(contato => {
                    const nome = (contato.nome || "").normalize("NFD").replace(/[^\w\s.-]/g, "").toLowerCase();
                    const busca = (buscaContato || "").normalize("NFD").replace(/[^\w\s.-]/g, "").toLowerCase();
                    const numero = (contato.numero || "");
                    const buscaNum = buscaContato.replace(/\D/g, "");
                    return (
                      nome.includes(busca) ||
                      (buscaNum && numero.includes(buscaNum))
                    );
                  })
                  .map(contato => (
                    <label key={contato.numero} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contatosSelecionados.includes(contato.numero)}
                        onChange={() => handleCheckContato(contato.numero)}
                      />
                      <span>{contato.nome} <span className="text-xs text-gray-500">({contato.numero})</span></span>
                    </label>
                  ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                  disabled={contatosSelecionados.length === 0}
                  onClick={handleEnviarParaSelecionados}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

}