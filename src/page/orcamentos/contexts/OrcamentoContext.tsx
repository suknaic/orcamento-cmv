import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { OrcamentoService } from '@/lib/services/orcamento.service';
import type { ItemOrcamento } from '@/lib/models/orcamento.models';

export interface ItemOrcamentoUI extends ItemOrcamento {
  _buscaMaterial?: string;
  _showDropdown?: boolean;
  imagensTemporarias?: Array<{
    id: number;
    src: string;
    nomeArquivo: string;
  }>;
}

export interface InfoOrcamento {
  cliente: string;
  validade: string;
  desconto: string;
  pagamento: string;
}

interface Contato {
  nome: string;
  numero: string;
}

interface OrcamentoContextType {
  // Estados dos produtos
  produtos: ItemOrcamentoUI[];
  setProdutos: React.Dispatch<React.SetStateAction<ItemOrcamentoUI[]>>;
  materiais: any[];
  setMateriais: React.Dispatch<React.SetStateAction<any[]>>;
  
  // Estados de modais e envios
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  showInfoModal: boolean;
  setShowInfoModal: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmaNomeModal: boolean;
  setShowConfirmaNomeModal: React.Dispatch<React.SetStateAction<boolean>>;
  showContatosModal: boolean;
  setShowContatosModal: React.Dispatch<React.SetStateAction<boolean>>;
  tipoEnvio: 'texto' | 'pdf';
  
  // Estados de contatos
  contatos: any[];
  setContatos: React.Dispatch<React.SetStateAction<any[]>>;
  contatoSelecionado: Contato | null;
  setContatoSelecionado: React.Dispatch<React.SetStateAction<Contato | null>>;
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
  orcamentoDataPdf: any[];
  valorTotal: number;
  
  // Refs
  materialRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  propostaRef: React.RefObject<HTMLDivElement>;

  // Serviço
  orcamentoService: OrcamentoService;
  
  // Funções
  adicionarProduto: () => void;
  removerProduto: (index: number) => void;
  copiarOrcamento: () => void;
  abrirModalContatos: (tipo: 'texto' | 'pdf') => Promise<void>;
  enviarPDFWhatsApp: () => Promise<void>;
  enviarMensagemWhatsApp: () => Promise<void>;
  confirmarEnvioMensagem: () => void;
  handleSelectContato: (contato: Contato) => void;
  calcularDesconto: (valorTotal: number, desconto: string) => number;
}

const OrcamentoContext = createContext<OrcamentoContextType | undefined>(undefined);

function adicionarCanvasPaginadoAoPdf(
  pdf: any,
  canvas: HTMLCanvasElement,
  node: HTMLElement,
  imgWidthMm = 210,
  pageHeightMm = 297
) {
  const getTopRelativo = (el: HTMLElement, root: HTMLElement): number => {
    let top = 0;
    let atual: HTMLElement | null = el;
    while (atual && atual !== root) {
      top += atual.offsetTop || 0;
      atual = atual.offsetParent as HTMLElement | null;
    }
    return top;
  };

  const unirRanges = (ranges: Array<{ top: number; bottom: number }>) => {
    if (ranges.length === 0) return ranges;
    const ordenados = [...ranges].sort((a, b) => a.top - b.top);
    const unidos: Array<{ top: number; bottom: number }> = [ordenados[0]];

    for (let i = 1; i < ordenados.length; i++) {
      const ultimo = unidos[unidos.length - 1];
      const atual = ordenados[i];
      if (atual.top <= ultimo.bottom) {
        ultimo.bottom = Math.max(ultimo.bottom, atual.bottom);
      } else {
        unidos.push({ ...atual });
      }
    }

    return unidos;
  };

  const pageHeightCanvasPx = (pageHeightMm * canvas.width) / imgWidthMm;
  const scaleRatio = canvas.height / Math.max(node.scrollHeight, 1);

  const blocosNaoQuebrar = Array.from(
    node.querySelectorAll('[data-pdf-no-split="true"]')
  ) as HTMLElement[];
  const blocosQuebraAntes = Array.from(
    node.querySelectorAll('[data-pdf-page-break-before="true"]')
  ) as HTMLElement[];

  const ranges = unirRanges(
    blocosNaoQuebrar
    .map((el) => {
      const top = getTopRelativo(el, node) * scaleRatio;
      const bottom = top + (el.offsetHeight || 0) * scaleRatio;
      return { top, bottom };
    })
    .filter((r) => r.bottom > r.top)
  );
  const quebrasForcadas = blocosQuebraAntes
    .map((el) => getTopRelativo(el, node) * scaleRatio)
    .filter((top) => Number.isFinite(top) && top > 1)
    .sort((a, b) => a - b);

  const segmentos: Array<{ start: number; end: number }> = [];
  const minSlicePx = pageHeightCanvasPx * 0.6;
  const margemSegurancaPx = pageHeightCanvasPx * 0.05;
  let start = 0;

  while (start < canvas.height - 1) {
    let end = Math.min(start + pageHeightCanvasPx, canvas.height);

    const quebraForcada = quebrasForcadas.find((q) => q > start + 10 && q < end - 10);
    if (quebraForcada !== undefined) {
      end = quebraForcada;
    }

    if (end < canvas.height && quebraForcada === undefined) {
      const crossing = ranges.find((r) => r.top < end && r.bottom > end);
      if (crossing) {
        const before = crossing.top - start;
        const after = crossing.bottom - start;

        if (before >= minSlicePx) {
          end = Math.max(start + minSlicePx, crossing.top - margemSegurancaPx);
        } else if (after <= pageHeightCanvasPx - margemSegurancaPx) {
          end = Math.min(canvas.height, crossing.bottom + margemSegurancaPx);
        }
      }
    }

    if (end <= start + 10) {
      end = Math.min(start + pageHeightCanvasPx, canvas.height);
    }

    segmentos.push({ start, end });
    start = end;
  }

  segmentos.forEach((seg, index) => {
    const sliceHeight = Math.max(1, Math.floor(seg.end - seg.start));
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;

    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      canvas,
      0,
      seg.start,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const imgData = sliceCanvas.toDataURL('image/jpeg', 0.9);
    const imgHeightMm = (sliceHeight * imgWidthMm) / canvas.width;

    if (index > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
  });
}

export function OrcamentoProvider({ children }: { children: React.ReactNode }) {
  const materialRefs = useRef<(HTMLInputElement | null)[]>([]);
  const propostaRef = useRef<HTMLDivElement>(null);
  const orcamentoService = new OrcamentoService();
  
  // Estados dos produtos
  const [produtos, setProdutos] = useState<ItemOrcamentoUI[]>([
    {
      id: Date.now(),
      produto: { id: 0, nome: '', unidadeMedida: 'm2', precoUnitario: 0 },
      componentes: [],
      quantidade: 1,
      quantidadeTotal: 0,
      precoTotal: 0,
      imagensTemporarias: [],
      _showDropdown: true,
    },
  ]);
  const [materiais, setMateriais] = useState([]);
  
  // Estados de modais
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmaNomeModal, setShowConfirmaNomeModal] = useState(false);
  const [showContatosModal, setShowContatosModal] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState<'texto' | 'pdf'>('texto');

  // Estados de contatos
  const [contatos, setContatos] = useState([]);
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);
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
  const valorBruto = produtos.reduce((acc, p) => acc + p.precoTotal, 0);
  const descontoAplicado = calcularDesconto(valorBruto, info.desconto);
  const valorTotal = Math.max(0, valorBruto - descontoAplicado);

  const orcamentoData = produtos.map((p) => {
    // Formatação para melhor visualização no PDF
    let descricaoFinal = p.produto.nome;
    
    // Se tem componentes, formata para o formato de medidas
    if (p.componentes.length > 0) {
      // Formata cada componente com sua descrição, medidas e quantidade.
      // O `\n` será interpretado como quebra de linha no PDF, tornando a lista mais legível.
      const componentesFormatados = p.componentes
        .map(c => `  • ${c.descricao || 'Medida'}: ${c.largura}x${c.altura}m (${c.quantidade}x)`)
        .join('\n');
      
      // Adiciona a lista de componentes abaixo do nome do produto.
      descricaoFinal = `${p.produto.nome}\n${componentesFormatados}`;
    }
    
    return {
      descricao: descricaoFinal,
      quantidade: p.quantidade, // Quantidade de produtos, não a área total
      valorUnitario: p.produto.precoUnitario,
      total: p.precoTotal,
    };
  });

  const orcamentoDataPdf = produtos.map((p) => {
    let descricaoFinal = p.produto.nome;

    if (p.componentes.length > 0) {
      const componentesFormatados = p.componentes
        .map(c => `  • ${c.descricao || 'Medida'}: ${c.largura}x${c.altura}m (${c.quantidade}x)`)
        .join('\n');

      descricaoFinal = `${p.produto.nome}\n${componentesFormatados}`;
    }

    const nomeItem = p.produto.nome || 'Item';
    const imagens = (p.imagensTemporarias || []).map((img, index) => ({
      src: img.src,
      legenda: `${nomeItem} - Imagem ${index + 1}`,
    }));

    return {
      descricao: descricaoFinal,
      quantidade: p.quantidade,
      valorUnitario: p.produto.precoUnitario,
      total: p.precoTotal,
      imagens,
    };
  });
  
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
        if (!p.produto.nome) return "";

        const componentesStr = p.componentes.map(c => 
          `  - ${c.descricao || 'Componente'}: ${c.largura}x${c.altura}m (${c.quantidade}x)`
        ).join('\n');

        // Adiciona linhas de detalhe com base no tipo de produto
        const detailLines = [];
        if (p.produto.unidadeMedida === 'm2') {
          detailLines.push(`Total (m²):.........................${p.quantidadeTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          detailLines.push(`V. Unit. (m²):...................R$ ${p.produto.precoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
        } else {
          // Para outros tipos, mostra a quantidade
          detailLines.push(`Quantidade:......................${p.quantidade} ${p.quantidade > 1 ? p.produto.unidadeMedida + 's' : p.produto.unidadeMedida}`);
        }

        return [
          `${p.produto.nome}`,
          componentesStr,
          ...detailLines,
          `TOTAL:.............................*R$${p.precoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*`,
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
      const novos: ItemOrcamentoUI[] = [
        ...produtos,
        {
          id: Date.now(),
          produto: { id: 0, nome: '', unidadeMedida: 'm2', precoUnitario: 0 },
          componentes: [],
          quantidade: 1,
          quantidadeTotal: 0,
          precoTotal: 0,
          imagensTemporarias: [],
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

  // Função para abrir o modal de contatos, verificando a conexão e buscando a lista.
  const abrirModalContatos = useCallback(async (tipo: 'texto' | 'pdf') => {
    setTipoEnvio(tipo); // Define o tipo de envio para uso posterior
    try {
      setLoadingEnviar(true);
      console.log("[OrcamentoContext] Verificando status do bot antes de exibir contatos...");
      
      // Verificar status do bot usando fetch
      const resStatus = await fetch('/api/bot-status');
      const statusData = await resStatus.json();
      console.log("[OrcamentoContext] Status do bot:", statusData);
      
      if (!statusData.connected) {
        toast.error(
          "O bot do WhatsApp não está conectado. Verifique a conexão no painel de WhatsApp.",
          { toastId: "whatsapp-not-connected" }
        );
        setLoadingEnviar(false);
        return;
      }
      
      console.log("[OrcamentoContext] Bot conectado, buscando contatos...");
      
      // Obter contatos, evitando cache
      const timestamp = new Date().getTime();
      const resContatos = await fetch(`/api/contatos?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      const contatosData = await resContatos.json();
      console.log("[OrcamentoContext] Resposta da API de contatos:", contatosData);
      
      if (contatosData.contatos && Array.isArray(contatosData.contatos)) {
        setContatos(contatosData.contatos);
        setShowModal(true);
        
        if (contatosData.contatos.length === 0) {
          toast.info(
            "Nenhum contato encontrado. Interaja com alguns contatos no WhatsApp primeiro.",
            { autoClose: 5000 }
          );
        }
      } else {
        console.error("[OrcamentoContext] Formato inesperado na resposta da API:", contatosData);
        toast.error("Erro ao carregar contatos. Verifique o console para mais detalhes.");
      }
    } catch (error) {
      console.error("[OrcamentoContext] Erro ao enviar por WhatsApp:", error);
      
      // Mensagem de erro mais específica
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao carregar contatos: ${errorMessage}`);
    } finally {
      setLoadingEnviar(false);
    }
  }, [setContatos, setShowModal, setLoadingEnviar]);

  // Centraliza a lógica para obter o nome do cliente
  const obterNomeClienteSelecionado = useCallback(() => {
    // Prioridade:
    // 1. Nome temporário (se o modal de confirmação foi usado).
    // 2. Nome do primeiro contato selecionado no modal.
    // 3. Nome digitado no campo "Cliente" da tela principal (fallback).
    // 4. "Cliente" como valor padrão.    
    return nomeTemporario || contatoSelecionado?.nome || info.cliente || 'Cliente';
  }, [contatoSelecionado, info.cliente, nomeTemporario]);

  const confirmarEnvioMensagem = () => {
    if (!contatoSelecionado) return;
    // Usa a função centralizada para obter o nome e abre o modal de confirmação.
    const nomeAtual = obterNomeClienteSelecionado();
    setNomeTemporario(nomeAtual);
    setShowConfirmaNomeModal(true);
  };

  const enviarMensagemWhatsApp = async () => {
    if (!contatoSelecionado) return;

    setLoadingEnviar(true);
    try {
      const nomeCliente = obterNomeClienteSelecionado();
      const mensagemComCliente = `*ORÇAMENTO PARA: ${nomeCliente.toUpperCase()}*\n\n${mensagem}`;

      console.log("Preparando para enviar mensagem de texto...");
      console.log("Enviando orçamento para:", nomeCliente, "Contato:", contatoSelecionado.numero);
      
      const resp = await fetch("/api/enviarMensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeros: [contatoSelecionado.numero],
          mensagem: mensagemComCliente,
          cliente_nome: nomeCliente,
          produtos: orcamentoData,
          valor_total: valorTotal,
        }),
      });

      let data = null;
      try {
        data = await resp.json();
        console.log("Resposta do servidor:", data);
      } catch (jsonErr) {
        console.error("Erro ao processar resposta do servidor:", jsonErr);
        toast.error("Erro ao processar resposta do servidor. Tente novamente.");
        setShowModal(false);
        setShowConfirmaNomeModal(false);
        return;
      }

      if (data && data.ok) {
        toast.success(`Mensagem enviada! ID: ${data.orcamentoId || 'N/A'}`);
      } else {
        toast.error(
          "Falha ao enviar mensagem: " + (data?.error || "Erro desconhecido")
        );
      }
    } catch (e) {
      console.error("Erro ao enviar mensagem:", e);
      toast.error("Erro ao enviar: " + e);
    } finally {
      setShowModal(false);
      setShowConfirmaNomeModal(false);
      setLoadingEnviar(false);
    }
  };

  const enviarPDFWhatsApp = async (): Promise<void> => {
    if (!contatoSelecionado) return;
    if (!propostaRef.current) {
      toast.error("Erro ao gerar PDF tente novamente");
      return;
    }

    setLoadingEnviar(true);
    try {
      console.log("Iniciando geração do PDF...");
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const node = propostaRef.current;
      const prevBorder = node.style.border;
      const prevBoxShadow = node.style.boxShadow;
      node.style.border = "none";
      node.style.boxShadow = "none";
      node.style.outline = "none";
      
      // Aguardar carregamento de imagens
      const images = node.querySelectorAll('img');
      await Promise.all(Array.from(images).filter(img => !img.complete).map(img => {
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      console.log("Renderizando HTML para canvas...");
      const canvas = await html2canvas(node, {
        backgroundColor: "#fff",
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: node.scrollWidth,
        height: node.scrollHeight,
        allowTaint: true,
      });

      node.style.border = prevBorder;
      node.style.boxShadow = prevBoxShadow;

      console.log("Gerando PDF a partir do canvas...");
      const pdf = new jsPDF("p", "mm", "a4");
      adicionarCanvasPaginadoAoPdf(pdf, canvas, node, 210, 297);

      const pdfBlob = pdf.output("blob");
      console.log(`PDF gerado: tamanho ${pdfBlob.size} bytes`);
      
      // Usa a função centralizada para obter o nome do cliente.
      const nomeCliente = obterNomeClienteSelecionado();

      console.log(`Enviando PDF para cliente: ${nomeCliente}`, "Contato:", contatoSelecionado.numero);
      
      const formData = new FormData();
      formData.append(
        "pdf",
        pdfBlob,
        `Orcamento-${nomeCliente}.pdf`
      );
      formData.append("numeros", JSON.stringify([contatoSelecionado.numero]));
      formData.append("cliente_nome", nomeCliente);
      formData.append("produtos", JSON.stringify(orcamentoData));
      formData.append("valor_total", valorTotal.toString());

      console.log("Enviando PDF para o servidor...");
      const resp = await fetch("/api/enviarPDF", {
        method: "POST",
        body: formData,
      });

      let data = null;
      try {
        data = await resp.json();
        console.log("Resposta do servidor:", data);
      } catch (jsonErr) {
        console.error("Erro ao processar resposta do servidor:", jsonErr);
        toast.error("Erro ao processar resposta do servidor. Tente novamente.");
        setShowModal(false);
        return;
      }

      if (data && data.ok) {
        toast.success(`PDF enviado! ID: ${data.orcamentoId || 'N/A'}`);
      } else {
        toast.error(
          "Falha ao enviar PDF: " + (data?.error || "Erro desconhecido")
        );
      }
    } catch (e) {
      console.error("Erro ao enviar PDF:", e);
      toast.error("Erro ao enviar PDF: " + e);
    } finally {
      setShowModal(false);
      setLoadingEnviar(false);
    }
  };

  const handleSelectContato = (contato: Contato) => {
    // Define o contato selecionado, ou desmarca se o mesmo for clicado novamente.
    setContatoSelecionado((prev) => (prev?.numero === contato.numero ? null : contato));
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
    showConfirmaNomeModal,
    setShowConfirmaNomeModal,
    contatos,
    setContatos,
    contatoSelecionado,
    setContatoSelecionado,
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
    orcamentoDataPdf,
    valorTotal,
    materialRefs,
    propostaRef,
    orcamentoService,
    adicionarProduto,
    removerProduto,
    copiarOrcamento,    
    abrirModalContatos,
    enviarPDFWhatsApp,
    enviarMensagemWhatsApp,
    confirmarEnvioMensagem,
    handleSelectContato,
    calcularDesconto,
    setShowContatosModal,
    showContatosModal,
    tipoEnvio
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
