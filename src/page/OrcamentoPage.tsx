import { useEffect, useState, useRef } from "react";
import { PropostaComercial } from "../components/proposta";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ToastContainer, toast } from "react-toastify";


  // (Removido daqui, será definido dentro do componente OrcamentoPage)


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
  const [loadingEnviar, setLoadingEnviar] = useState(false);

    // Estado para modal de informações extras
  const [showInfoModal, setShowInfoModal] = useState<false | 'pdf'>(false);
  const [info, setInfo] = useState({
    cliente: "",
    validade: "7 dias",
    desconto: "",
    pagamento: "À vista"
  });
  const propostaRef = useRef(null);



  const [contatos, setContatos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [contatosSelecionados, setContatosSelecionados] = useState([]);
  const [buscaContato, setBuscaContato] = useState("");


  const [materiais, setMateriais] = useState([]);
  const [produtos, setProdutos] = useState([
    { materialSelecionado: null, tipo: '', preco: 0, largura: '', altura: '', quantidade: 1, valor: 0 }
  ]);
  const [mensagem, setMensagem] = useState("");

  // Monta os dados do orçamento para passar para o componente PropostaComercial
  const orcamentoData = produtos.map((p, idx) => ({
    descricao: p.materialSelecionado ? p.materialSelecionado +
      (p.tipo === 'm2' ? ` (${p.largura}x${p.altura}m${p.quantidade > 1 ? `, ${p.quantidade}x` : ''})` :
        p.tipo === 'milheiro' ? (p.quantidade === 1 ? ' (1 milheiro)' : ` (${p.quantidade} milheiros)`) :
        p.tipo === 'unidade' ? (p.quantidade === 1 ? ' (1 unidade)' : ` (${p.quantidade} unidades)`) :
        p.tipo === 'kit' ? (p.quantidade === 1 ? ' (1 kit)' : ` (${p.quantidade} kits)`) :
        '') : '',
    quantidade: p.quantidade,
    valorUnitario: p.preco,
    total: p.valor
  }));
  const valorTotal = produtos.reduce((acc, p) => acc + p.valor, 0);

   // Carrega materiais do backend ao montar
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setMateriais(data.materiais || []);
      })
      .catch(() => {
        toast.error('Erro ao carregar materiais do banco!');
      });
  }, []);

  // Atualiza tipo e preco ao selecionar material de cada produto
  useEffect(() => {
    setProdutos(produtos => produtos.map((p, idx) => {
      if (!p.materialSelecionado) return { ...p };
      const mat = materiais.find(m => m.nome === p.materialSelecionado);
      if (!mat) return { ...p };
      let tipoDetectado = 'unidade';
      if (/m2|acm|lona|adesivo|acrílico/i.test(mat.nome)) tipoDetectado = 'm2';
      if (/milheiro/i.test(mat.nome)) tipoDetectado = 'milheiro';
      if (/kit/i.test(mat.nome)) tipoDetectado = 'kit';
      return { ...p, tipo: tipoDetectado, preco: mat.preco };
    }));
  }, [materiais, produtos.map(p => p.materialSelecionado).join()]);

  useEffect(() => {
    setProdutos(produtos => produtos.map(p => ({
      ...p,
      valor: calcularOrcamento(
        p.materialSelecionado,
        p.tipo,
        p.preco,
        p.largura,
        p.altura,
        p.quantidade
      )
    })));
  }, [produtos.map(p => [p.materialSelecionado, p.tipo, p.preco, p.largura, p.altura, p.quantidade].join()).join()]);

  useEffect(() => {
    // Gera mensagem geral do orçamento
    const agora = new Date();
    const dataStr = agora.toLocaleDateString("pt-BR");
    const horaStr = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    function addBusinessDays(date, days) {
      let result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() !== 0 && result.getDay() !== 6) {
          added++;
        }
      }
      return result;
    }
    const prazoProducao = 2;
    const previsaoEntrega = addBusinessDays(agora, prazoProducao);
    const previsaoStr = previsaoEntrega.toLocaleDateString("pt-BR");
    const msg = produtos.map((p, idx) =>
      p.materialSelecionado ?
        `${idx + 1}. ${p.materialSelecionado} (${p.quantidade}x) - *R$${p.valor.toLocaleString("pt-BR", {minimumFractionDigits:2})}*` : ''
    ).filter(Boolean).join('\n');
    setMensagem(
      `Orçamento:\n${msg}\nValor total: *R$${valorTotal.toLocaleString("pt-BR", {minimumFractionDigits:2})}*\nValidade: 7 dias\nPrazo de produção: ${prazoProducao} dias úteis\nData: ${dataStr}\nHora: ${horaStr}\nPrevisão para entrega: ${previsaoStr}`
    );
  }, [produtos, valorTotal]);

  // Rodapé fixo para mensagem
  const rodape = [
    'CNPJ: 52.548.924/0001-20',
    'JULIO DESIGNER',
    'travessa da vitória, Nº 165',
    'bairro: Montanhês',
    'Cep: 69.921-554',
    'WhatsApp: (68) 99976-0124',
  ];

  function copiar() {
    const mensagemComRodape = `${mensagem}\n\n${rodape.join("\n")}`;
    navigator.clipboard.writeText(mensagemComRodape);
    toast.success("Mensagem copiada!");
  }

  async function enviarWhatsApp() {
    // Busca contatos reais do backend
    try {
      const res = await fetch("/api/contatos");
      const lista = await res.json();
      setContatos(lista);
      setShowModal(true);
    } catch (e) {
      toast.error("Erro ao buscar contatos: " + e);
    }
  }

  // Substituir handleEnviarParaSelecionados para gerar e enviar PDF
  async function enviarMensagemWhatsApp() {
    if (contatosSelecionados.length === 0) return;
    setLoadingEnviar(true);
    try {
      const resp = await fetch('/api/enviarMensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeros: contatosSelecionados,
          mensagem
        })
      });
      let data = null;
      try {
        data = await resp.json();
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
      toast.error("Erro ao enviar: " + e);
    }
    setShowModal(false);
    setLoadingEnviar(false);
  }

  async function enviarPDFWhatsApp() {
    if (contatosSelecionados.length === 0) return;
    if (!propostaRef.current) return toast.error('Erro ao gerar PDF: componente não encontrado');
    setLoadingEnviar(true);
    try {
      // Gera PDF real usando jsPDF
      const jsPDF = (await import('jspdf')).jsPDF;
      const html2canvas = (await import('html2canvas')).default;
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const node = propostaRef.current;
      // Usa html2canvas para capturar imagem, mas insere no PDF corretamente
      const canvas = await html2canvas(node, { backgroundColor: '#fff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Calcula proporção para caber na página
      const imgProps = pdf.getImageProperties(imgData);
      let pdfWidth = pageWidth;
      let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      if (pdfHeight > pageHeight) {
        pdfHeight = pageHeight;
        pdfWidth = (imgProps.width * pdfHeight) / imgProps.height;
      }
      pdf.addImage(imgData, 'PNG', (pageWidth - pdfWidth) / 2, 20, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'proposta.pdf');
      formData.append('numeros', JSON.stringify(contatosSelecionados));
      // Não envia mensagem junto!
      const resp = await fetch('/api/enviarPDF', {
        method: 'POST',
        body: formData
      });
      let data = null;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        toast.error("Erro ao processar resposta do servidor. Tente novamente.");
        setShowModal(false);
        return;
      }
      if (data && data.ok) {
        toast.success("PDF enviado para os contatos selecionados!");
      } else {
        toast.error("Falha ao enviar PDF: " + (data?.error || "Erro desconhecido"));
      }
    } catch (e) {
      toast.error("Erro ao enviar PDF: " + e);
    }
    setShowModal(false);
    setLoadingEnviar(false);
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
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Novo Orçamento</h2>
        {produtos.map((p, idx) => (
          <div key={p.materialSelecionado ? p.materialSelecionado + '-' + idx : idx} className="mb-2 border-b pb-2 last:border-b-0 last:pb-0">
            <div
              className="grid grid-cols-1 sm:grid-cols-[1.2fr_repeat(2,0.8fr)_0.7fr_1fr_auto] gap-x-4 gap-y-2 items-end"
            >
              <div className="flex flex-col min-w-0">
                <label className="block mb-0.5 font-semibold text-md">Material</label>
                <select
                  className="border rounded px-2 py-1 min-w-[100px] text-md"
                  value={p.materialSelecionado || ""}
                  onChange={e => setProdutos(produtos => produtos.map((prod, i) => {
                    if (i !== idx) return prod;
                    // Ao trocar material, reseta campos de m2
                    return {
                      ...prod,
                      materialSelecionado: e.target.value,
                      largura: '',
                      altura: '',
                      quantidade: 1
                    };
                  }))}
                >
                  <option value="">Selecione...</option>  
                  {materiais.map((mat, i) => (
                    <option key={mat.nome} value={mat.nome}>{mat.nome}</option>
                  ))}
                </select>
                {/* Debug visual do tipo */}
                 <span style={{ fontSize: 10, color: '#888' }}>Tipo detectado: {p.tipo}</span>
              </div>
              {p.tipo && tiposMateriais[p.tipo]?.campos.includes("largura") ? (
                <div className="flex flex-col min-w-0">
                  <label className="block mb-0.5 text-xs">Largura (m)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="border rounded px-4 py-2 min-w-[120px] text-base"
                    value={p.largura}
                    onChange={e => setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, largura: e.target.value } : prod))}
                  />
                </div>
              ) : <div />}
              {p.tipo && tiposMateriais[p.tipo]?.campos.includes("altura") ? (
                <div className="flex flex-col min-w-0">
                  <label className="block mb-0.5 text-xs">Altura (m)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="border rounded px-4 py-2 min-w-[120px] text-base"
                    value={p.altura}
                    onChange={e => setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, altura: e.target.value } : prod))}
                  />
                </div>
              ) : <div />}
              {p.tipo && tiposMateriais[p.tipo]?.campos.includes("quantidade") ? (
                <div className="flex flex-col min-w-0">
                  <label className="block mb-0.5 text-xs">Qtd</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="border rounded px-4 py-2 min-w-[90px] text-base"
                    value={p.quantidade}
                    onChange={e => setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, quantidade: Number(e.target.value) } : prod))}
                  />
                </div>
              ) : <div />}
              <div className="flex flex-col min-w-0 text-right">
                <label className="block mb-0.5 text-xs">Subtotal</label>
                <span className="text-green-700 font-bold text-sm">R${p.valor.toLocaleString("pt-BR", {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex items-center justify-end min-w-0">
                {produtos.length > 1 && (
                  <button type="button" className="text-red-600 text-xs px-2 py-1 hover:underline" onClick={() => setProdutos(produtos => produtos.filter((_, i) => i !== idx))}>Remover</button>
                )}
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="mb-4 px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
          onClick={() => setProdutos(produtos => [...produtos, { materialSelecionado: null, tipo: '', preco: 0, largura: '', altura: '', quantidade: 1, valor: 0 }])}
        >
          + Adicionar produto
        </button>
        <div className="mb-4 mt-4">
          <span className="font-semibold">Valor total: </span>
          <span className="text-lg text-green-700 font-bold">R${valorTotal.toLocaleString("pt-BR", {minimumFractionDigits:2})}</span>
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
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold"
            type="button"
            onClick={() => setShowInfoModal('pdf')}
          >
            Enviar PDF
          </button>
        </div>
        {/* Modal de informações extras */}
        {showInfoModal === 'pdf' && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-8 max-w-md w-full relative">
              <h3 className="text-xl font-bold mb-4">Informações extras</h3>
              <div className="flex flex-col gap-3">
                <label>
                  Cliente:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1"
                    name="cliente"
                    value={info.cliente}
                    onChange={e => setInfo({ ...info, cliente: e.target.value })}
                  />
                </label>
                <label>
                  Validade da proposta:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1"
                    name="validade"
                    value={info.validade}
                    onChange={e => setInfo({ ...info, validade: e.target.value })}
                  />
                </label>
                <label>
                  Desconto:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1"
                    name="desconto"
                    value={info.desconto}
                    onChange={e => setInfo({ ...info, desconto: e.target.value })}
                  />
                </label>
                <label>
                  Forma de pagamento:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1"
                    name="pagamento"
                    value={info.pagamento}
                    onChange={e => setInfo({ ...info, pagamento: e.target.value })}
                  />
                </label>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowInfoModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                  onClick={async () => {
                    setShowInfoModal(false);
                    // Após preencher info extra, abrir modal de contatos para envio de mensagem texto
                    try {
                      const res = await fetch("/api/contatos");
                      const lista = await res.json();
                      setContatos(lista);
                      setShowModal(true);
                    } catch (e) {
                      toast.error("Erro ao buscar contatos: " + e);
                    }
                  }}
                >
                  Enviar WhatsApp
                </button>
                <button
                  className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
                  onClick={async () => {
                    if (!propostaRef.current) return toast.error('Erro ao gerar PDF: componente não encontrado');
                    const node = propostaRef.current;
                    const prevBorder = node.style.border;
                    const prevBoxShadow = node.style.boxShadow;
                    node.style.border = 'none';
                    node.style.boxShadow = 'none';
                    node.style.outline = 'none';
                    try {
                      const canvas = await html2canvas(node, {backgroundColor: '#fff'});
                      const imgData = canvas.toDataURL('image/png');
                      const img = new window.Image();
                      img.src = imgData;
                      img.onload = () => {
                        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [img.width, img.height] });
                        pdf.addImage(img, 'PNG', 0, 0, img.width, img.height);
                        pdf.save('proposta.pdf');
                      };
                    } catch (e) {
                      toast.error('Erro ao baixar PDF: ' + e);
                    } finally {
                      node.style.border = prevBorder;
                      node.style.boxShadow = prevBoxShadow;
                    }
                  }}
                >
                  Baixar PDF
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Renderização invisível do PropostaComercial para gerar PDF */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, border: 'none', boxShadow: 'none', outline: 'none' }}>
          <div ref={propostaRef} className=" rounded-none shadow-none border-none isolate">
            <PropostaComercial
              cliente={info.cliente || 'Cliente'}
              validade={info.validade || '7 dias'}
              desconto={info.desconto}
              pagamento={info.pagamento || 'À vista'}
              orcamento={orcamentoData}
              total={valorTotal}
            />
          </div>
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
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center gap-2"
                  disabled={contatosSelecionados.length === 0 || loadingEnviar}
                  onClick={enviarMensagemWhatsApp}
                >
                  {loadingEnviar && (
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loadingEnviar ? "Enviando..." : "Enviar"}
                </button>
                <button
                  className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 flex items-center gap-2"
                  disabled={contatosSelecionados.length === 0 || loadingEnviar}
                  onClick={enviarPDFWhatsApp}
                >
                  {loadingEnviar && (
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loadingEnviar ? "Enviando..." : "Enviar PDF"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

}