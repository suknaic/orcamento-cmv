import { useEffect, useState, useRef } from "react";
import { AnimatedSubscribeButton } from "@/components/magicui/animated-subscribe-button";
import { PropostaComercial } from "@/components/proposta";
import { Modal } from "@/components/ui/modal";
import { Button, CancelButton, SendButton } from "@/components/ui/button-variants";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// (Removido daqui, será definido dentro do componente OrcamentoPage)

// Tipos de materiais e lógica de cálculo
const tiposMateriais = {
  m2: { campos: ["largura", "altura", "quantidade"] },
  unidade: { campos: ["quantidade"] },
  milheiro: { campos: ["quantidade"] },
  kit: { campos: ["quantidade"] },
};

function calcularOrcamento(material, tipo, preco, largura, altura, quantidade) {
  if (!material || !tipo) return 0;

  // Normalizar inputs numéricos
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
}

export function OrcamentoPage() {
  const materialRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loadingEnviar, setLoadingEnviar] = useState(false);

  // Estado para modal de informações extras
  const [showInfoModal, setShowInfoModal] = useState<false | "pdf">(false);
  const [showNomeModal, setShowNomeModal] = useState(false);
  const [showConfirmaNomeModal, setShowConfirmaNomeModal] = useState(false);
  const [nomeTemporario, setNomeTemporario] = useState("");
  const [info, setInfo] = useState({
    cliente: "",
    validade: "7 dias",
    desconto: "",
    pagamento: "À vista",
  });
  const propostaRef = useRef(null);

  const [contatos, setContatos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [contatosSelecionados, setContatosSelecionados] = useState([]);
  const [buscaContato, setBuscaContato] = useState("");
  const [tipoEnvio, setTipoEnvio] = useState<"mensagem" | "pdf">("mensagem"); // Controla o tipo de envio

  const [materiais, setMateriais] = useState([]);
  type ProdutoOrcamento = {
    materialSelecionado: any;
    tipo: string;
    preco: number;
    largura: string;
    altura: string;
    quantidade: number;
    valor: number;
    _buscaMaterial?: string;
    _showDropdown?: boolean;
  };
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([
    {
      materialSelecionado: null,
      tipo: "",
      preco: 0,
      largura: "",
      altura: "",
      quantidade: 1,
      valor: 0,
    },
  ]);
  const [mensagem, setMensagem] = useState("");

  // Monta os dados do orçamento para passar para o componente PropostaComercial
  // Calcula desconto (pode ser % ou valor fixo)
  function calcularDesconto(valorTotal: number, desconto: string) {
    if (!desconto) return 0;

    // Remove espaços e normaliza vírgulas para pontos
    const descontoLimpo = desconto.trim().replace(",", ".");

    if (descontoLimpo.includes("%")) {
      const perc = parseFloat(descontoLimpo.replace("%", ""));
      if (!isNaN(perc) && isFinite(perc)) {
        return valorTotal * (perc / 100);
      }
    } else {
      const val = parseFloat(descontoLimpo);
      if (!isNaN(val) && isFinite(val)) {
        return val;
      }
    }
    return 0;
  }

  const orcamentoData = produtos.map((p, idx) => {
    // Valor unitário real: total dividido pela quantidade (evita divisão por zero)
    const valorUnitario = p.quantidade > 0 ? p.valor / p.quantidade : 0;
    return {
      descricao: p.materialSelecionado
        ? p.materialSelecionado +
          (p.tipo === "m2"
            ? ` (${p.largura}x${p.altura}m${
                p.quantidade > 1 ? `, ${p.quantidade}x` : ""
              })`
            : p.tipo === "milheiro"
            ? p.quantidade === 1
              ? " (1 milheiro)"
              : ` (${p.quantidade} milheiros)`
            : p.tipo === "unidade"
            ? p.quantidade === 1
              ? " (1 unidade)"
              : ` (${p.quantidade} unidades)`
            : p.tipo === "kit"
            ? p.quantidade === 1
              ? " (1 kit)"
              : ` (${p.quantidade} kits)`
            : "")
        : "",
      quantidade: p.quantidade,
      valorUnitario,
      total: p.valor,
    };
  });
  const valorBruto = produtos.reduce((acc, p) => acc + p.valor, 0);
  const descontoAplicado = calcularDesconto(valorBruto, info.desconto);
  const valorTotal = Math.max(0, valorBruto - descontoAplicado);

  // Carrega materiais do backend ao montar
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setMateriais(data.materiais || []);
      })
      .catch(() => {
        toast.error("Erro ao carregar materiais do banco!");
      });
  }, []);

  // Atualiza tipo e preco ao selecionar material de cada produto
  useEffect(() => {
    setProdutos((produtos) =>
      produtos.map((p, idx) => {
        if (!p.materialSelecionado) return { ...p };
        const mat = materiais.find((m) => m.nome === p.materialSelecionado);
        if (!mat) return { ...p };
        // Se o material já tem tipo definido no banco, respeite-o
        let tipoDetectado = mat.tipo || "unidade";
        // Se não houver tipo no banco, tente inferir pelo nome

        return { ...p, tipo: tipoDetectado, preco: mat.preco };
      })
    );
  }, [materiais, produtos.map((p) => p.materialSelecionado).join()]);

  useEffect(() => {
    setProdutos((produtos) =>
      produtos.map((p) => ({
        ...p,
        valor: calcularOrcamento(
          p.materialSelecionado,
          p.tipo,
          p.preco,
          p.largura,
          p.altura,
          p.quantidade
        ),
      }))
    );
  }, [
    produtos
      .map((p) =>
        [
          p.materialSelecionado,
          p.tipo,
          p.preco,
          p.largura,
          p.altura,
          p.quantidade,
        ].join()
      )
      .join(),
  ]);

  // ...código anterior...

  useEffect(() => {
    // Gera mensagem geral do orçamento com novo formato
    const agora = new Date();
    const dataStr = agora.toLocaleDateString("pt-BR");
    const horaStr = agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

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

    // NOVO FORMATO DE PRODUTO
    const msg = produtos
      .map((p, idx) => {
        if (!p.materialSelecionado) return "";
        const quantidade = p.quantidade || 1;
        const largura = p.largura
          ? Number(p.largura).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })
          : "";
        const altura = p.altura
          ? Number(p.altura).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })
          : "";
        const tam = largura && altura ? `tam. ${largura}x${altura}m` : "";
        const valorUnit = p.quantidade > 0 ? p.valor / p.quantidade : 0;
        return [
          `${quantidade} un. ${p.materialSelecionado}`,
          tam,
          `V. Unit.:............................R$ ${valorUnit.toLocaleString(
            "pt-BR",
            { minimumFractionDigits: 2 }
          )}`,
          `TOTAL:.............................*R$${p.valor.toLocaleString(
            "pt-BR",
            { minimumFractionDigits: 2 }
          )}*`,
          "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .filter(Boolean)
      .join("\n\n");

    setMensagem(
      `*ORÇAMENTO*:\n${msg}\n\nValor total: *R$${valorTotal.toLocaleString(
        "pt-BR",
        { minimumFractionDigits: 2 }
      )}*\nValidade: 7 dias\nPrazo de produção: ${prazoProducao} dias úteis\nData: ${dataStr}\nHora: ${horaStr}\nPrevisão para entrega: ${previsaoStr}`
    );
  }, [produtos, valorTotal]);

  // ...código posterior...

  // Rodapé fixo para mensagem
  const rodape = [
    "CNPJ: 52.548.924/0001-20",
    "JULIO DESIGNER",
    "travessa da vitória, Nº 165",
    "bairro: Montanhês",
    "Cep: 69.921-554",
    "WhatsApp: (68) 99976-0124",
  ];

  const dadosBancarios = [
    "PIX 6899976-0124",
    "BANCO DO BRASIL",
    "AG. 2358-2",
    "CC. 108822-X",
  ];

  // Estado para feedback do botão copiar
  const [copiado, setCopiado] = useState(false);
  function copiar() {
    const mensagemComRodape = `${mensagem}\n\n${rodape.join(
      "\n"
    )}\n\n${dadosBancarios.join("\n")}`;
    navigator.clipboard.writeText(mensagemComRodape);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  async function enviarWhatsApp() {
    // Busca contatos reais do backend
    try {
      const res = await fetch("/api/contatos");
      const lista = await res.json();
      setContatos(lista);
      setTipoEnvio("mensagem"); // Define como envio de mensagem apenas
      setShowModal(true);
    } catch (e) {
      toast.error("Erro ao buscar contatos: " + e);
    }
  }

  // Função para confirmar nome antes do envio
  function confirmarEnvioMensagem() {
    if (contatosSelecionados.length === 0) return;

    // Obter nome do primeiro contato selecionado
    const primeiroContato = contatos.find(
      (c) => c.numero === contatosSelecionados[0]
    );
    const nomeAtual = info.cliente || primeiroContato?.nome || "Cliente";

    // Preencher o modal com o nome atual
    setNomeTemporario(nomeAtual);
    setShowConfirmaNomeModal(true);
  }

  // Substituir handleEnviarParaSelecionados para gerar e enviar PDF
  async function enviarMensagemWhatsApp() {
    if (contatosSelecionados.length === 0) return;

    setLoadingEnviar(true);
    try {
      // Usar o nome confirmado no modal
      const nomeCliente = nomeTemporario || "Cliente";

      // Adicionar cabeçalho com nome do cliente na mensagem
      const mensagemComCliente = `*ORÇAMENTO PARA: ${nomeCliente.toUpperCase()}*\n\n${mensagem}`;

      const resp = await fetch("/api/enviarMensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeros: contatosSelecionados,
          mensagem: mensagemComCliente,
          cliente_nome: nomeCliente,
          produtos: orcamentoData,
          valor_total: valorTotal,
        }),
      });
      let data = null;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        toast.error("Erro ao processar resposta do servidor. Tente novamente.");
        setShowModal(false);
        setShowConfirmaNomeModal(false);
        return;
      }
      if (data && data.ok) {
        toast.success("Mensagem enviada para os contatos selecionados!");
      } else {
        toast.error(
          "Falha ao enviar mensagem: " + (data?.error || "Erro desconhecido")
        );
      }
    } catch (e) {
      toast.error("Erro ao enviar: " + e);
    }
    setShowModal(false);
    setShowConfirmaNomeModal(false);
    setLoadingEnviar(false);
  }

  async function enviarPDFWhatsApp() {
    if (contatosSelecionados.length === 0) return;
    if (!propostaRef.current)
      return toast.error("Erro ao gerar PDF tente novamente");
    setLoadingEnviar(true);
    try {
      const jsPDF = (await import("jspdf")).jsPDF;
      const html2canvas = (await import("html2canvas")).default;

      const node = propostaRef.current;
      const prevBorder = node.style.border;
      const prevBoxShadow = node.style.boxShadow;
      node.style.border = "none";
      node.style.boxShadow = "none";
      node.style.outline = "none";

      // Configurações otimizadas para performance
      const canvas = await html2canvas(node, {
        backgroundColor: "#fff",
        scale: 1.5, // Reduzido para melhor performance
        useCORS: true,
        logging: false,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      node.style.border = prevBorder;
      node.style.boxShadow = prevBoxShadow;

      // Converter com compressão JPEG
      const imgData = canvas.toDataURL("image/jpeg", 0.8);

      // Criar PDF otimizado
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      formData.append(
        "pdf",
        pdfBlob,
        `Orcamento-${info.cliente || "Cliente"}.pdf`
      );
      formData.append("numeros", JSON.stringify(contatosSelecionados));
      formData.append("cliente_nome", info.cliente || "Cliente");
      formData.append("produtos", JSON.stringify(orcamentoData));
      formData.append("valor_total", valorTotal.toString());

      const resp = await fetch("/api/enviarPDF", {
        method: "POST",
        body: formData,
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
        toast.error(
          "Falha ao enviar PDF: " + (data?.error || "Erro desconhecido")
        );
      }
    } catch (e) {
      toast.error("Erro ao enviar PDF: " + e);
    }
    setShowModal(false);
    setLoadingEnviar(false);
  }
  function handleCheckContato(numero) {
    setContatosSelecionados((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero]
    );
  }

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="auto"
        className="relative"
      />
      <div className="max-w-6xl mx-auto space-y-6 mt-4 sm:mt-10">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              Criar Novo Orçamento
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Monte seu orçamento adicionando produtos, configure valores e
              envie via WhatsApp ou PDF profissional
            </p>
          </div>
        </div>

        {/* Seção de Produtos */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
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
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    1. Selecionar Produtos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Adicione os produtos e configure suas especificações
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
                  <p className="text-xs text-muted-foreground">Total de itens</p>
                  <p className="text-2xl font-bold text-primary">
                    {produtos.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {produtos.map((p, idx) => (
              <div
                key={`produto-${idx}-${p.materialSelecionado || "empty"}`}
                className="bg-muted/30 border border-border rounded-lg p-5 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    Produto {idx + 1}
                  </h3>
                  {produtos.length > 1 && (
                    <button
                      type="button"
                      className="ml-auto text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                      title="Remover produto"
                      onClick={() =>
                        setProdutos((produtos) =>
                          produtos.filter((_, i) => i !== idx)
                        )
                      }
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
                          materialRefs.current[idx] = el;
                        }}
                        type="text"
                        className="border border-input rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-ring focus:border-ring transition-colors outline-none bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="Digite ou busque um produto..."
                        value={p._buscaMaterial || ""}
                        onChange={(e) => {
                          const busca = e.target.value;
                          setProdutos((produtos) =>
                            produtos.map((prod, i) =>
                              i === idx
                                ? { ...prod, _buscaMaterial: busca }
                                : prod
                            )
                          );
                        }}
                        onFocus={(e) => {
                          if (!p._showDropdown) {
                            setProdutos((produtos) =>
                              produtos.map((prod, i) =>
                                i === idx
                                  ? { ...prod, _showDropdown: true }
                                  : { ...prod, _showDropdown: false }
                              )
                            );
                          }
                        }}
                        onBlur={(e) => {
                          setTimeout(() => {
                            setProdutos((produtos) =>
                              produtos.map((prod, i) =>
                                i === idx
                                  ? { ...prod, _showDropdown: false }
                                  : prod
                              )
                            );
                          }, 150);
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        tabIndex={-1}
                        onClick={() =>
                          setProdutos((produtos) =>
                            produtos.map((prod, i) =>
                              i === idx
                                ? {
                                    ...prod,
                                    _showDropdown: !prod._showDropdown,
                                  }
                                : { ...prod, _showDropdown: false }
                            )
                          )
                        }
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
                      {p._showDropdown && (
                        <div className="absolute z-30 left-0 right-0 bg-popover border border-border rounded-b-lg shadow-xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                          {materiais.filter((mat) => {
                            const busca = (
                              p._buscaMaterial || ""
                            ).toLowerCase();
                            return (
                              !busca || mat.nome.toLowerCase().includes(busca)
                            );
                          }).length === 0 ? (
                            <div className="px-4 py-6 text-center">
                              <svg
                                className="w-12 h-12 mx-auto mb-3 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <p className="text-muted-foreground text-sm">
                                Nenhum produto encontrado
                              </p>
                              <p className="text-muted-foreground/70 text-xs mt-1">
                                Tente outro termo de busca
                              </p>
                            </div>
                          ) : (
                            materiais
                              .filter((mat) => {
                                const busca = (
                                  p._buscaMaterial || ""
                                ).toLowerCase();
                                return (
                                  !busca ||
                                  mat.nome.toLowerCase().includes(busca)
                                );
                              })
                              .map((mat) => (
                                <button
                                  type="button"
                                  key={`material-${idx}-${mat.nome}`}
                                  className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3 border-b border-border last:border-b-0 ${
                                    p.materialSelecionado === mat.nome
                                      ? "bg-accent/50 border-primary/20"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setProdutos((produtos) =>
                                      produtos.map((prod, i) =>
                                        i === idx
                                          ? {
                                              ...prod,
                                              materialSelecionado: mat.nome,
                                              preco: mat.preco,
                                              tipo: prod.tipo,
                                              largura: "",
                                              altura: "",
                                              quantidade: 1,
                                              _buscaMaterial: mat.nome,
                                              _showDropdown: false,
                                            }
                                          : prod
                                      )
                                    );
                                  }}
                                >
                                  <div className="flex-1">
                                    <div
                                      className="font-medium text-foreground truncate"
                                      title={mat.nome}
                                    >
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
                                        R${" "}
                                        {Number(mat.preco).toLocaleString(
                                          "pt-BR",
                                          { minimumFractionDigits: 2 }
                                        )}
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
                  {p.tipo &&
                    tiposMateriais[p.tipo]?.campos.includes("largura") && (
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
                          value={p.largura}
                          onChange={(e) =>
                            setProdutos((produtos) =>
                              produtos.map((prod, i) =>
                                i === idx
                                  ? { ...prod, largura: e.target.value }
                                  : prod
                              )
                            )
                          }
                        />
                      </div>
                    )}

                  {p.tipo &&
                    tiposMateriais[p.tipo]?.campos.includes("altura") && (
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
                          value={p.altura}
                          onChange={(e) =>
                            setProdutos((produtos) =>
                              produtos.map((prod, i) =>
                                i === idx
                                  ? { ...prod, altura: e.target.value }
                                  : prod
                              )
                            )
                          }
                        />
                      </div>
                    )}

                  {p.tipo &&
                    tiposMateriais[p.tipo]?.campos.includes("quantidade") && (
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
                          value={p.quantidade}
                          onChange={(e) =>
                            setProdutos((produtos) =>
                              produtos.map((prod, i) =>
                                i === idx
                                  ? {
                                      ...prod,
                                      quantidade: Number(e.target.value),
                                    }
                                  : prod
                              )
                            )
                          }
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
                        R${" "}
                        {p.valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      {p.quantidade > 1 && p.valor > 0 && (
                        <div className="text-sm text-primary/80 mt-1">
                          R${" "}
                          {(p.valor / p.quantidade).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          por {p.tipo === "m2" ? "m²" : "unidade"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Botão Adicionar Produto */}
            <button
              type="button"
              className="w-full border-2 border-dashed border-primary/30 rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
              onClick={() => {
                setProdutos((produtos) => {
                  const novos = [
                    ...produtos,
                    {
                      materialSelecionado: null,
                      tipo: "",
                      preco: 0,
                      largura: "",
                      altura: "",
                      quantidade: 1,
                      valor: 0,
                      _showDropdown: true,
                    },
                  ];
                  setTimeout(() => {
                    if (materialRefs.current[novos.length - 1]) {
                      materialRefs.current[novos.length - 1].focus();
                    }
                  }, 50);
                  return novos.map((prod, i) =>
                    i === novos.length - 1
                      ? { ...prod, _showDropdown: true }
                      : { ...prod, _showDropdown: false }
                  );
                });
              }}
            >
              <div className="flex flex-col items-center gap-3 text-primary group-hover:text-primary/80">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    Adicionar Novo Produto
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Clique para incluir mais um item ao orçamento
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
        {/* Seção de Resumo */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  2. Resumo do Orçamento
                </h2>
                <p className="text-sm text-muted-foreground">
                  Confira os valores e visualize sua proposta
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna Esquerda - Valores */}
              <div className="space-y-6">
               
                <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          Enviar Orçamento
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Escolha a forma de compartilhar sua proposta comercial
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="group flex flex-col h-full">
                        <div className="text-center mb-4 flex-1 flex flex-col justify-center">
                          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3 group-hover:bg-accent transition-colors">
                            <svg
                              className="w-8 h-8 text-muted-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-bold text-foreground mb-2">Copiar Texto</h3>
                          <p className="text-sm text-muted-foreground">
                            Copia o orçamento para usar em qualquer lugar
                          </p>
                        </div>
                        <AnimatedSubscribeButton
                          subscribeStatus={copiado}
                          onClick={copiar}
                          className="w-full bg-muted hover:bg-accent text-foreground border border-border px-6 py-[38] rounded-xl font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg min-h-[56px]"
                        >
                          <span>Copiar Orçamento</span>
                          <span>✅ Copiado!</span>
                        </AnimatedSubscribeButton>
                      </div>

                      <div className="group flex flex-col h-full">
                        <div className="text-center mb-4 flex-1 flex flex-col justify-center">
                          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                            <svg
                              className="w-8 h-8 text-green-600 dark:text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-bold text-foreground mb-2">Mensagem WhatsApp</h3>
                          <p className="text-sm text-muted-foreground">
                            Envia mensagem de texto via WhatsApp
                          </p>
                        </div>
                        <button
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg min-h-[56px]"
                          type="button"
                          onClick={enviarWhatsApp}
                        >
                          Enviar por WhatsApp
                        </button>
                      </div>

                      <div className="group flex flex-col h-full">
                        <div className="text-center mb-4 flex-1 flex flex-col justify-center">
                          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                            <svg
                              className="w-8 h-8 text-red-600 dark:text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-bold text-foreground mb-2">Proposta <br /> PDF</h3>
                          <p className="text-sm text-muted-foreground">
                            Gera PDF profissional e envia via WhatsApp
                          </p>
                        </div>
                        <button
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg min-h-[56px]"
                          type="button"
                          onClick={() => {
                            setTipoEnvio("pdf");
                            setShowInfoModal("pdf");
                          }}
                        >
                          Gerar e Enviar PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Prévia da Mensagem */}
              <div className="space-y-6">
                <div className="bg-muted/30 border border-border rounded-xl p-6">
                  <label className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Prévia da Mensagem WhatsApp
                  </label>
                  <textarea
                    className="border border-input rounded-lg px-4 py-4 w-full text-sm bg-background text-foreground resize-none font-mono leading-relaxed"
                    rows={12}
                    value={mensagem}
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta é a mensagem que será enviada via WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Ações */}

        {/* Renderização invisível do PropostaComercial para gerar PDF */}
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        >
          <div
            ref={propostaRef}
            className="rounded-none shadow-none border-none isolate"
          >
            <PropostaComercial
              cliente={info.cliente || "Cliente"}
              validade={info.validade || "7 dias"}
              desconto={Number(info.desconto)}
              pagamento={info.pagamento || "À vista"}
              orcamento={orcamentoData}
              total={valorTotal}
            />
          </div>
        </div>
      </div>
      {/* Renderização invisível do PropostaComercial para gerar PDF */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          border: "none",
          boxShadow: "none",
          outline: "none",
        }}
      >
        <div
          ref={propostaRef}
          className="rounded-none shadow-none border-none isolate"
        >
          <PropostaComercial
            cliente={info.cliente || "Cliente"}
            validade={info.validade || "7 dias"}
            desconto={Number(info.desconto)}
            pagamento={info.pagamento || "À vista"}
            orcamento={orcamentoData}
            total={valorTotal}
          />
        </div>
      </div>

      {/* Modal de informações extras */}
      <Modal
        isOpen={showInfoModal === "pdf"}
        onClose={() => setShowInfoModal(false)}
        title="Finalizar Orçamento"
        subtitle="Complete as informações para gerar o orçamento"
        variant="default"
        size="lg"
        footer={
          <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
            <CancelButton onClick={() => setShowInfoModal(false)} />
            <SendButton
              onClick={async () => {
                setShowInfoModal(false);
                try {
                  const res = await fetch("/api/contatos");
                  const lista = await res.json();
                  setContatos(lista);
                  setShowModal(true);
                } catch (e) {
                  toast.error("Erro ao buscar contatos: " + e);
                }
              }}
              loading={loadingEnviar}
            >
              {tipoEnvio === "pdf" ? "Continuar para Envio PDF" : "Continuar para WhatsApp"}
            </SendButton>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!propostaRef.current)
                  return toast.error(
                    "Erro ao gerar PDF: componente não encontrado"
                  );
                const node = propostaRef.current;
                const prevBorder = node.style.border;
                const prevBoxShadow = node.style.boxShadow;
                node.style.border = "none";
                node.style.boxShadow = "none";
                node.style.outline = "none";
                try {
                  const canvas = await html2canvas(node, {
                    backgroundColor: "#fff",
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    width: node.scrollWidth,
                    height: node.scrollHeight,
                  });

                  const imgData = canvas.toDataURL("image/jpeg", 0.8);
                  const pdf = new jsPDF("p", "mm", "a4");
                  const imgWidth = 210;
                  const pageHeight = 297;
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  let heightLeft = imgHeight;
                  let position = 0;

                  pdf.addImage(
                    imgData,
                    "JPEG",
                    0,
                    position,
                    imgWidth,
                    imgHeight
                  );
                  heightLeft -= pageHeight;

                  while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(
                      imgData,
                      "JPEG",
                      0,
                      position,
                      imgWidth,
                      imgHeight
                    );
                    heightLeft -= pageHeight;
                  }

                  pdf.save(`Orcamento_${info.cliente || "Cliente"}.pdf`);

                  node.style.border = prevBorder;
                  node.style.boxShadow = prevBoxShadow;

                  toast.success("PDF salvo com sucesso!");
                } catch (error) {
                  node.style.border = prevBorder;
                  node.style.boxShadow = prevBoxShadow;
                  console.error("Erro ao gerar PDF:", error);
                  toast.error("Erro ao gerar PDF: " + error);
                }
              }}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Baixar PDF
            </Button>
            
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nome do Cliente
                </div>
              </label>
              <input
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                name="cliente"
                value={info.cliente}
                placeholder="Ex: João Silva"
                onChange={(e) =>
                  setInfo({ ...info, cliente: e.target.value })
                }
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-5 8a1 1 0 100-2 1 1 0 000 2zm5-8H9a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 00-1-1z" />
                    </svg>
                    Validade
                  </div>
                </label>
                <input
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  name="validade"
                  value={info.validade}
                  placeholder="Ex: 7 dias"
                  onChange={(e) =>
                    setInfo({ ...info, validade: e.target.value })
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Entrada/Desconto
                  </div>
                </label>
                <input
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  name="desconto"
                  value={info.desconto}
                  placeholder="Ex: R$ 500,00 ou 10%"
                  onChange={(e) =>
                    setInfo({ ...info, desconto: e.target.value })
                  }
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Forma de Pagamento
                </div>
              </label>
              <input
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                name="pagamento"
                value={info.pagamento}
                placeholder="Ex: À vista, 2x sem juros, etc."
                onChange={(e) =>
                  setInfo({ ...info, pagamento: e.target.value })
                }
              />
            </div>
          </div>
          
          {/* Resumo do orçamento */}
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Resumo do Orçamento
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor Total:</span>
                <span className="font-bold text-lg text-primary">R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
              </div>
              {info.desconto && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Entrada/Desconto:</span>
                  <span className="font-semibold text-green-600">{info.desconto}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-accent/30">
                <span className="text-muted-foreground">Total de itens:</span>
                <span className="font-semibold text-foreground">{produtos.filter(p => p.materialSelecionado).length}</span>
              </div>
            </div>
          </div>
        </div>
      
      </Modal>
      {/* Modal de seleção de contatos */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full border border-border overflow-hidden">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
            </div>
            <div>
          <h3 className="text-xl font-bold text-foreground">
            {tipoEnvio === "pdf" ? "Selecionar Contatos para PDF" : "Selecionar Contatos para Mensagem"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {tipoEnvio === "pdf" 
              ? "Escolha os contatos que receberão o orçamento em PDF via WhatsApp" 
              : "Escolha os contatos que receberão a mensagem de orçamento via WhatsApp"
            }
          </p>
            </div>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 space-y-6">
          {/* Campo de Busca */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
            </div>
            <input
          className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
          placeholder="Buscar por nome ou telefone..."
          value={buscaContato}
          onChange={(e) => setBuscaContato(e.target.value)}
          autoFocus
            />
          </div>

          {/* Lista de Contatos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">
            Contatos Disponíveis
          </label>
          {contatosSelecionados.length > 0 && (
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              {contatosSelecionados.length} selecionado{contatosSelecionados.length > 1 ? 's' : ''}
            </span>
          )}
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-lg p-2 bg-muted/20">
          {contatos.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-muted-foreground font-medium">Nenhum contato encontrado</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Verifique se há contatos cadastrados no sistema</p>
            </div>
          ) : (
            contatos
              .filter((contato) => {
            const nome = (contato.nome || "")
              .normalize("NFD")
              .replace(/[^\w\s.-]/g, "")
              .toLowerCase();
            const busca = (buscaContato || "")
              .normalize("NFD")
              .replace(/[^\w\s.-]/g, "")
              .toLowerCase();
            const numero = contato.numero || "";
            const buscaNum = buscaContato.replace(/\D/g, "");
            return (
              nome.includes(busca) ||
              (buscaNum && numero.includes(buscaNum))
            );
              })
              .map((contato) => (
            <label
              key={`contato-${contato.numero}-${contato.nome || "sem-nome"}`}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                contatosSelecionados.includes(contato.numero)
              ? 'bg-primary/10 border-2 border-primary/30'
              : 'bg-background border border-border hover:border-primary/50'
              }`}
            >
              <div className="relative">
                <input
              type="checkbox"
              checked={contatosSelecionados.includes(contato.numero)}
              onChange={() => handleCheckContato(contato.numero)}
              className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              contatosSelecionados.includes(contato.numero)
                ? 'bg-primary border-primary'
                : 'border-muted-foreground hover:border-primary'
                }`}>
              {contatosSelecionados.includes(contato.numero) && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
              {contato.nome || "Sem nome"}
                </div>
                <div className="text-sm text-muted-foreground">
              {contato.numero}
                </div>
              </div>
              
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
            </label>
              ))
          )}
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="bg-muted/30 px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
          <button
            className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium transition-all duration-200 hover:scale-105 border border-border"
            onClick={() => {
          setShowModal(false);
          setContatosSelecionados([]);
            }}
          >
            Cancelar
          </button>
          
          {tipoEnvio === "mensagem" && (
            <button
          className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={contatosSelecionados.length === 0 || loadingEnviar}
          onClick={confirmarEnvioMensagem}
            >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {loadingEnviar ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Enviando Mensagem...
            </>
          ) : (
            `Enviar Mensagem (${contatosSelecionados.length})`
          )}
            </button>
          )}
          
          {tipoEnvio === "pdf" && (
            <button
          className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={contatosSelecionados.length === 0 || loadingEnviar}
          onClick={enviarPDFWhatsApp}
            >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {loadingEnviar ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Gerando e Enviando PDF...
            </>
          ) : (
            `Enviar PDF (${contatosSelecionados.length})`
          )}
            </button>
          )}

        </div>
         
        </div>
        </div>
      )}


      {showConfirmaNomeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card rounded shadow-lg p-8 max-w-md w-full relative border border-border">
            <h3 className="text-xl font-bold mb-4 text-foreground">
              Confirmar Nome do Cliente
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Confirme ou edite o nome do cliente que aparecerá no orçamento:
            </p>
            <input
              type="text"
              placeholder="Digite o nome do cliente..."
              value={nomeTemporario}
              onChange={(e) => setNomeTemporario(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-6 bg-card text-foreground border-border focus:ring-2 focus:ring-ring focus:border-ring"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => {
                  setShowConfirmaNomeModal(false);
                  setNomeTemporario("");
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center gap-2"
                onClick={() => {
                  if (nomeTemporario.trim()) {
                    setShowConfirmaNomeModal(false);
                    enviarMensagemWhatsApp();
                  } else {
                    toast.error("Por favor, informe o nome do cliente");
                  }
                }}
                disabled={!nomeTemporario.trim() || loadingEnviar}
              >
                {loadingEnviar && (
                  <svg
                    className="animate-spin h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                )}
                {loadingEnviar ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para capturar nome do cliente */}
      {showNomeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card rounded shadow-lg p-8 max-w-md w-full relative border border-border">
            <h3 className="text-xl font-bold mb-4 text-foreground">
              Nome do Cliente
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              O contato selecionado não possui nome cadastrado. Por favor,
              informe o nome do cliente para o orçamento:
            </p>
            <input
              type="text"
              placeholder="Digite o nome do cliente..."
              value={nomeTemporario}
              onChange={(e) => setNomeTemporario(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-6 bg-card text-foreground border-border focus:ring-2 focus:ring-ring focus:border-ring"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => {
                  setShowNomeModal(false);
                  setNomeTemporario("");
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                onClick={() => {
                  if (nomeTemporario.trim()) {
                    setShowNomeModal(false);
                    // Usar o nome temporário e continuar com o envio
                    enviarMensagemWhatsApp();
                  } else {
                    toast.error("Por favor, informe o nome do cliente");
                  }
                }}
                disabled={!nomeTemporario.trim()}
              >
                Continuar Envio
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
