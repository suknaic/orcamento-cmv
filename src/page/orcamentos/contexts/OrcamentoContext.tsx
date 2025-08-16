import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

export interface ProdutoOrcamento {
  materialSelecionado: any;
  tipo: string;
  preco: number;
  largura: string;
  altura: string;
  quantidade: number;
  valor: number;
  _buscaMaterial?: string;
  _showDropdown?: boolean;
}

export interface InfoOrcamento {
  cliente: string;
  validade: string;
  desconto: string;
  pagamento: string;
}

interface OrcamentoContextType {
  // Estados dos produtos
  produtos: ProdutoOrcamento[];
  setProdutos: React.Dispatch<React.SetStateAction<ProdutoOrcamento[]>>;
  materiais: any[];
  setMateriais: React.Dispatch<React.SetStateAction<any[]>>;
  
  // Estados de modais e envios
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  showInfoModal: false | "pdf";
  setShowInfoModal: React.Dispatch<React.SetStateAction<false | "pdf">>;
  showNomeModal: boolean;
  setShowNomeModal: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmaNomeModal: boolean;
  setShowConfirmaNomeModal: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Estados de contatos
  contatos: any[];
  setContatos: React.Dispatch<React.SetStateAction<any[]>>;
  contatosSelecionados: string[];
  setContatosSelecionados: React.Dispatch<React.SetStateAction<string[]>>;
  buscaContato: string;
  setBuscaContato: React.Dispatch<React.SetStateAction<string>>;
  
  // Estados de loading e feedback
  loadingEnviar: boolean;
  setLoadingEnviar: React.Dispatch<React.SetStateAction<boolean>>;
  copiado: boolean;
  setCopiado: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Estados de informações do orçamento
  info: InfoOrcamento;
  setInfo: React.Dispatch<React.SetStateAction<InfoOrcamento>>;
  nomeTemporario: string;
  setNomeTemporario: React.Dispatch<React.SetStateAction<string>>;
  
  // Estados calculados
  mensagem: string;
  orcamentoData: any[];
  valorTotal: number;
  
  // Refs
  materialRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  propostaRef: React.RefObject<HTMLDivElement>;
  
  // Funções
  adicionarProduto: () => void;
  removerProduto: (index: number) => void;
  copiarOrcamento: () => void;
  enviarWhatsApp: () => Promise<void>;
  enviarPDFWhatsApp: () => Promise<void>;
  enviarMensagemWhatsApp: () => Promise<void>;
  confirmarEnvioMensagem: () => void;
  handleCheckContato: (numero: string) => void;
  calcularDesconto: (valorTotal: number, desconto: string) => number;
}

const OrcamentoContext = createContext<OrcamentoContextType | undefined>(undefined);

export function OrcamentoProvider({ children }: { children: React.ReactNode }) {
  const materialRefs = useRef<(HTMLInputElement | null)[]>([]);
  const propostaRef = useRef<HTMLDivElement>(null);
  
  // Estados dos produtos
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
  const [materiais, setMateriais] = useState([]);
  
  // Estados de modais
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState<false | "pdf">(false);
  const [showNomeModal, setShowNomeModal] = useState(false);
  const [showConfirmaNomeModal, setShowConfirmaNomeModal] = useState(false);
  
  // Estados de contatos
  const [contatos, setContatos] = useState([]);
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);
  const [buscaContato, setBuscaContato] = useState("");
  
  // Estados de loading
  const [loadingEnviar, setLoadingEnviar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  
  // Estados de informações
  const [info, setInfo] = useState<InfoOrcamento>({
    cliente: "",
    validade: "7 dias",
    desconto: "",
    pagamento: "À vista",
  });
  const [nomeTemporario, setNomeTemporario] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Função para calcular desconto
  const calcularDesconto = (valorTotal: number, desconto: string) => {
    if (!desconto) return 0;
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
  };

  // Cálculos derivados
  const orcamentoData = produtos.map((p) => {
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

  // Carregar materiais
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

  // Gerar mensagem do orçamento
  useEffect(() => {
    const agora = new Date();
    const dataStr = agora.toLocaleDateString("pt-BR");
    const horaStr = agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    function addBusinessDays(date: Date, days: number) {
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

    const msg = produtos
      .map((p) => {
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

  // Funções
  const adicionarProduto = () => {
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
          materialRefs.current[novos.length - 1]?.focus();
        }
      }, 50);
      return novos.map((prod, i) =>
        i === novos.length - 1
          ? { ...prod, _showDropdown: true }
          : { ...prod, _showDropdown: false }
      );
    });
  };

  const removerProduto = (index: number) => {
    setProdutos((produtos) => produtos.filter((_, i) => i !== index));
  };

  const copiarOrcamento = () => {
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
      "CC. 108822-X",
    ];

    const mensagemComRodape = `${mensagem}\n\n${rodape.join(
      "\n"
    )}\n\n${dadosBancarios.join("\n")}`;
    navigator.clipboard.writeText(mensagemComRodape);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  const enviarWhatsApp = async () => {
    try {
      const res = await fetch("/api/contatos");
      const lista = await res.json();
      setContatos(lista);
      setShowModal(true);
    } catch (e) {
      toast.error("Erro ao buscar contatos: " + e);
    }
  };

  const confirmarEnvioMensagem = () => {
    if (contatosSelecionados.length === 0) return;
    const primeiroContato = contatos.find(
      (c: any) => c.numero === contatosSelecionados[0]
    );
    const nomeAtual = info.cliente || primeiroContato?.nome || "Cliente";
    setNomeTemporario(nomeAtual);
    setShowConfirmaNomeModal(true);
  };

  const enviarMensagemWhatsApp = async () => {
    if (contatosSelecionados.length === 0) return;

    setLoadingEnviar(true);
    try {
      const nomeCliente = nomeTemporario || "Cliente";
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
  };

  const enviarPDFWhatsApp = async (): Promise<void> => {
    if (contatosSelecionados.length === 0) return;
    if (!propostaRef.current) {
      toast.error("Erro ao gerar PDF tente novamente");
      return;
    }

    setLoadingEnviar(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const node = propostaRef.current;
      const prevBorder = node.style.border;
      const prevBoxShadow = node.style.boxShadow;
      node.style.border = "none";
      node.style.boxShadow = "none";
      node.style.outline = "none";

      const canvas = await html2canvas(node, {
        backgroundColor: "#fff",
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      node.style.border = prevBorder;
      node.style.boxShadow = prevBoxShadow;

      const imgData = canvas.toDataURL("image/jpeg", 0.8);
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
  };

  const handleCheckContato = (numero: string) => {
    setContatosSelecionados((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero]
    );
  };

  const contextValue: OrcamentoContextType = {
    produtos,
    setProdutos,
    materiais,
    setMateriais,
    showModal,
    setShowModal,
    showInfoModal,
    setShowInfoModal,
    showNomeModal,
    setShowNomeModal,
    showConfirmaNomeModal,
    setShowConfirmaNomeModal,
    contatos,
    setContatos,
    contatosSelecionados,
    setContatosSelecionados,
    buscaContato,
    setBuscaContato,
    loadingEnviar,
    setLoadingEnviar,
    copiado,
    setCopiado,
    info,
    setInfo,
    nomeTemporario,
    setNomeTemporario,
    mensagem,
    orcamentoData,
    valorTotal,
    materialRefs,
    propostaRef,
    adicionarProduto,
    removerProduto,
    copiarOrcamento,
    enviarWhatsApp,
    enviarPDFWhatsApp,
    enviarMensagemWhatsApp,
    confirmarEnvioMensagem,
    handleCheckContato,
    calcularDesconto,
  };

  return (
    <OrcamentoContext.Provider value={contextValue}>
      {children}
    </OrcamentoContext.Provider>
  );
}

export function useOrcamentoContext() {
  const context = useContext(OrcamentoContext);
  if (context === undefined) {
    throw new Error('useOrcamentoContext deve ser usado dentro de um OrcamentoProvider');
  }
  return context;
}
