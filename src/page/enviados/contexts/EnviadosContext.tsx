import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

interface Orcamento {
  id: number;
  cliente_nome: string;
  cliente_numero: string;
  produtos: any[];
  valor_total: number;
  tipo_envio: string;
  data_criacao: string;
  data_envio: string;
  status: string;
}

interface Stats {
  totalOrcamentos: number;
  valorTotalGeral: number;
  orcamentosEnviados: number;
  orcamentosCriados: number;
  valorMedio: number;
}

interface EnviadosContextType {
  // Estados principais
  orcamentos: Orcamento[];
  stats: Stats;
  loading: boolean;
  initialLoading: boolean;
  search: string;
  activeFilter: string;
  searchTimeout: NodeJS.Timeout | null;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  currentPage: number;
  totalPages: number;
  totalItems: number;
  expandedOrcamento: number | null;
  
  // Estados de modais e ações
  showReenvioModal: Orcamento | null;
  contatos: any[];
  contatosSelecionados: string[];
  loadingReenvio: boolean;
  tipoEnvio: 'mensagem' | 'pdf';
  showInfoModal: false | 'pdf' | 'whatsapp';
  orcamentoSelecionado: Orcamento | null;
  info: {
    cliente: string;
    validade: string;
    desconto: string;
    pagamento: string;
  };
  
  // Refs
  propostaRef: React.RefObject<HTMLDivElement>;
  
  // Funções
  setSearch: (search: string) => void;
  setActiveFilter: (filter: string) => void;
  setCurrentPage: (page: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  setExpandedOrcamento: (id: number | null) => void;
  setShowReenvioModal: (orcamento: Orcamento | null) => void;
  setContatosSelecionados: (contatos: string[]) => void;
  setTipoEnvio: (tipo: 'mensagem' | 'pdf') => void;
  setShowInfoModal: (show: false | 'pdf' | 'whatsapp') => void;
  setOrcamentoSelecionado: (orcamento: Orcamento | null) => void;
  setInfo: (info: any) => void;
  
  fetchOrcamentos: (page?: number, searchTerm?: string, filterStatus?: string, showLoading?: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  handleQuickFilter: (status: string) => void;
  clearAllFilters: () => void;
  handlePageChange: (page: number) => void;
  handleSort: (field: string) => void;
  abrirReenvioMensagem: (orcamento: Orcamento) => Promise<void>;
  abrirReanvioComInfo: (orcamento: Orcamento, tipo: 'pdf' | 'whatsapp') => void;
  enviarPDFDireto: () => Promise<void>;
  handleReenvio: (tipo: 'mensagem' | 'pdf') => Promise<void>;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

const EnviadosContext = createContext<EnviadosContextType | undefined>(undefined);

export function useEnviadosContext() {
  const context = useContext(EnviadosContext);
  if (!context) {
    throw new Error("useEnviadosContext deve ser usado dentro de EnviadosProvider");
  }
  return context;
}

export function EnviadosProvider({ children }: { children: React.ReactNode }) {
  // Estados principais
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrcamentos: 0,
    valorTotalGeral: 0,
    orcamentosEnviados: 0,
    orcamentosCriados: 0,
    valorMedio: 0
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [sortBy, setSortBy] = useState('data_criacao');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedOrcamento, setExpandedOrcamento] = useState<number | null>(null);
  
  // Estados de modais e ações
  const [showReenvioModal, setShowReenvioModal] = useState<Orcamento | null>(null);
  const [contatos, setContatos] = useState([]);
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);
  const [loadingReenvio, setLoadingReenvio] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState<'mensagem' | 'pdf'>('mensagem');
  const [showInfoModal, setShowInfoModal] = useState<false | 'pdf' | 'whatsapp'>(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
  const [info, setInfo] = useState({
    cliente: "",
    validade: "7 dias",
    desconto: "",
    pagamento: "À vista"
  });
  
  // Refs
  const propostaRef = useRef(null);
  
  const itemsPerPage = 10;

  const fetchOrcamentos = async (page = 1, searchTerm = search, filterStatus = activeFilter, showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        sortBy,
        sortOrder
      });
      
      if (filterStatus) {
        params.append('status', filterStatus);
      }
      
      const response = await fetch(`/api/orcamentosEnviados?${params}`);
      const data = await response.json();
      
      if (data.ok) {
        setOrcamentos(data.orcamentos);
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      } else {
        toast.error('Erro ao carregar orçamentos: ' + data.error);
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamentos: ' + error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/orcamentosEnviados', { method: 'OPTIONS' });
      const data = await response.json();
      
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleQuickFilter = (status: string) => {
    if (activeFilter === status) {
      setActiveFilter('');
    } else {
      setActiveFilter(status);
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setActiveFilter('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchOrcamentos(page, search, activeFilter, false);
    }
  };

  const handleSort = (field: string) => {
    const newSortOrder = sortBy === field ? (sortOrder === 'ASC' ? 'DESC' : 'ASC') : 'DESC';
    setSortBy(field);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const abrirReenvioMensagem = async (orcamento: Orcamento) => {
    console.log('[EnvidadoContext] objeto orcamento: ', orcamento.produtos)
    if (!orcamento.cliente_numero) {
      toast.error("Orçamento não possui número de contato associado");
      return;
    }
    
    setLoadingReenvio(true);
    try {
      const response = await fetch('/api/reenviarOrcamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orcamento.id,
          numeros: [orcamento.cliente_numero],
          tipo: 'mensagem'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast.success(`Mensagem reenviada para ${orcamento.cliente_nome.toUpperCase()}!`);
        fetchOrcamentos(currentPage);
      } else {
        toast.error('Erro ao reenviar mensagem: ' + data.error);
      }
    } catch (error) {
      toast.error('Erro ao reenviar mensagem: ' + error);
    }
    setLoadingReenvio(false);
  };
  
  const abrirReanvioComInfo = (orcamento: Orcamento, tipo: 'pdf' | 'whatsapp') => {
    if (!orcamento.cliente_numero) {
      toast.error("Orçamento não possui número de contato associado");
      return;
    }
    
    setOrcamentoSelecionado(orcamento);
    setInfo({
      cliente: orcamento.cliente_nome,
      validade: "7 dias",
      desconto: "",
      pagamento: "À vista"
    });
    setShowInfoModal('pdf');
  };

  const enviarPDFDireto = async () => {
    if (!orcamentoSelecionado?.cliente_numero) {
      toast.error("Orçamento não possui número de contato associado");
      return;
    }

    if (!propostaRef.current) {
      toast.error("Erro ao gerar PDF: componente não encontrado");
      return;
    }
    
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    
    setLoadingReenvio(true);
    try {
      const node = propostaRef.current;
      const prevBorder = (node as HTMLElement).style.border;
      const prevBoxShadow = (node as HTMLElement).style.boxShadow;
      (node as HTMLElement).style.border = 'none';
      (node as HTMLElement).style.boxShadow = 'none';
      (node as HTMLElement).style.outline = 'none';

      // Aguardar carregamento de imagens
      const images = node.querySelectorAll('img');
      await Promise.all(Array.from(images).filter((img: HTMLImageElement) => !img.complete).map((img: HTMLImageElement) => {
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(node, {
        backgroundColor: '#fff',
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: (node as HTMLElement).scrollWidth,
        height: (node as HTMLElement).scrollHeight,
        allowTaint: true,
      });
      
      (node as HTMLElement).style.border = prevBorder;
      (node as HTMLElement).style.boxShadow = prevBoxShadow;
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      
      const mensagem = `📋 *REENVIO DO ORÇAMENTO PARA: ${orcamentoSelecionado.cliente_nome.toUpperCase()}*\n\nSegue em anexo a proposta comercial em PDF.`;
      
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `Orcamento-${orcamentoSelecionado.cliente_nome}-${orcamentoSelecionado.id}.pdf`);
      formData.append('numeros', JSON.stringify([orcamentoSelecionado.cliente_numero]));
      formData.append('mensagem', mensagem);
      formData.append('cliente_nome', info.cliente || orcamentoSelecionado.cliente_nome);
      formData.append('produtos', JSON.stringify(orcamentoSelecionado.produtos));
      formData.append('valor_total', orcamentoSelecionado.valor_total.toString());
      
      const response = await fetch('/api/enviarPDF', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.ok) {
        const sucessos = data.resultados?.filter((r: any) => r.status === 'ok')?.length || 0;
        if (sucessos > 0) {
          toast.success(`PDF enviado com sucesso para ${orcamentoSelecionado.cliente_nome.toUpperCase()}!`);
        } else {
          toast.error('Falha ao enviar PDF. Verifique a conexão do WhatsApp.');
        }
        setShowInfoModal(false);
        setOrcamentoSelecionado(null);
        fetchOrcamentos(currentPage);
      } else {
        toast.error('Erro ao enviar PDF: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      toast.error('Erro ao gerar/enviar PDF: ' + error.message);
    }
    setLoadingReenvio(false);
  };

  const handleReenvio = async (tipo: 'mensagem' | 'pdf') => {
    if (!showReenvioModal || contatosSelecionados.length === 0) return;
    
    setLoadingReenvio(true);
    try {
      const response = await fetch('/api/reenviarOrcamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: showReenvioModal.id,
          numeros: contatosSelecionados,
          tipo
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast.success(`Orçamento reenviado para ${data.resultados.filter((r: any) => r.status === 'ok').length} contatos!`);
        setShowReenvioModal(null);
        setContatosSelecionados([]);
        fetchOrcamentos(currentPage);
      } else {
        toast.error('Erro ao reenviar: ' + data.error);
      }
    } catch (error) {
      toast.error('Erro ao reenviar: ' + error);
    }
    setLoadingReenvio(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado': return 'text-green-800 dark:text-green-400 bg-green-200 dark:bg-green-900 border border-green-300 dark:border-green-800';
      case 'reenviado': return 'text-blue-800 dark:text-blue-400 bg-blue-200 dark:bg-blue-900 border border-blue-300 dark:border-blue-800';
      case 'erro_envio': return 'text-red-800 dark:text-red-400 bg-red-200 dark:bg-red-900 border border-red-300 dark:border-red-800';
      case 'enviando': return 'text-amber-800 dark:text-amber-400 bg-amber-200 dark:bg-amber-900 border border-amber-300 dark:border-amber-800';
      default: return 'text-gray-700 dark:text-muted-foreground bg-gray-200 dark:bg-muted border border-gray-300 dark:border-border';
    }
  };

  // Efeitos para busca e ordenação
  useEffect(() => {
    if (initialLoading) {
      // Primera carga
      fetchOrcamentos(1, search, activeFilter, true);
      fetchStats();
    } else {
      // Cambios posteriores en filtros/orden
      setCurrentPage(1);
      fetchOrcamentos(1, search, activeFilter, false);
      fetchStats();
    }
  }, [sortBy, sortOrder, activeFilter]);

  // Busca em tempo real com debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const newTimeout = setTimeout(() => {
      setCurrentPage(1);
      fetchOrcamentos(1, search, activeFilter, false);
      setSearchTimeout(null);
    }, 500);

    setSearchTimeout(newTimeout);

    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
  }, [search]);

  // Cleanup do timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  const value: EnviadosContextType = {
    // Estados principais
    orcamentos,
    stats,
    loading,
    initialLoading,
    search,
    activeFilter,
    searchTimeout,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    totalItems,
    expandedOrcamento,
    
    // Estados de modais e ações
    showReenvioModal,
    contatos,
    contatosSelecionados,
    loadingReenvio,
    tipoEnvio,
    showInfoModal,
    orcamentoSelecionado,
    info,
    
    // Refs
    propostaRef,
    
    // Funções setters
    setSearch,
    setActiveFilter,
    setCurrentPage,
    setSortBy,
    setSortOrder,
    setExpandedOrcamento,
    setShowReenvioModal,
    setContatosSelecionados,
    setTipoEnvio,
    setShowInfoModal,
    setOrcamentoSelecionado,
    setInfo,
    
    // Funções de ação
    fetchOrcamentos,
    fetchStats,
    handleQuickFilter,
    clearAllFilters,
    handlePageChange,
    handleSort,
    abrirReenvioMensagem,
    abrirReanvioComInfo,
    enviarPDFDireto,
    handleReenvio,
    formatDate,
    getStatusColor,
  };

  return (
    <EnviadosContext.Provider value={value}>
      {children}
    </EnviadosContext.Provider>
  );
}
