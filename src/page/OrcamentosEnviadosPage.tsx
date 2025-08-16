import { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import { PropostaComercial } from "@/components/proposta";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import "react-toastify/dist/ReactToastify.css";

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

export function OrcamentosEnviadosPage() {
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
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showReenvioModal, setShowReenvioModal] = useState<Orcamento | null>(null);
  const [contatos, setContatos] = useState([]);
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);
  const [loadingReenvio, setLoadingReenvio] = useState(false);
  const [expandedOrcamento, setExpandedOrcamento] = useState<number | null>(null);
  const [tipoEnvio, setTipoEnvio] = useState<'mensagem' | 'pdf'>('mensagem');
  
  // Estados para modal de informações extras (igual ao OrcamentoPage)
  const [showInfoModal, setShowInfoModal] = useState<false | 'pdf' | 'whatsapp'>(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
  const [info, setInfo] = useState({
    cliente: "",
    validade: "7 dias",
    desconto: "",
    pagamento: "À vista"
  });
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
      
      // Adicionar filtro de status se ativo
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

  useEffect(() => {
    fetchOrcamentos(1, search, activeFilter, initialLoading);
    fetchStats();
  }, [sortBy, sortOrder, activeFilter]);

  // Busca em tempo real com debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const newTimeout = setTimeout(() => {
      setCurrentPage(1);
      fetchOrcamentos(1, search, activeFilter, false); // Não mostrar loading para busca
    }, 500); // 500ms de delay

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // A busca já é feita automaticamente pelo useEffect, mas mantemos para compatibilidade
  };

  // Nova função para filtros rápidos
  const handleQuickFilter = (status: string) => {
    if (activeFilter === status) {
      // Se o filtro já está ativo, remove
      setActiveFilter('');
    } else {
      setActiveFilter(status);
    }
    setCurrentPage(1);
  };

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearch('');
    setActiveFilter('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchOrcamentos(page, search, activeFilter, false); // Não mostrar loading para paginação
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const abrirReenvioMensagem = async (orcamento: Orcamento) => {
    // Enviar mensagem diretamente para o contato original, sem modal de seleção
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
        fetchOrcamentos(currentPage); // Recarregar lista
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

  // Nova função para enviar PDF diretamente para o contato original
  const enviarPDFDireto = async () => {
    if (!orcamentoSelecionado?.cliente_numero) {
      toast.error("Orçamento não possui número de contato associado");
      return;
    }

    if (!propostaRef.current) {
      toast.error("Erro ao gerar PDF: componente não encontrado");
      return;
    }
    
    console.log('Iniciando geração e envio de PDF para:', orcamentoSelecionado.cliente_nome, orcamentoSelecionado.cliente_numero);
    
    setLoadingReenvio(true);
    try {
      // Gerar PDF primeiro
      const node = propostaRef.current;
      const prevBorder = node.style.border;
      const prevBoxShadow = node.style.boxShadow;
      node.style.border = 'none';
      node.style.boxShadow = 'none';
      node.style.outline = 'none';

      // Configurações otimizadas para performance e tamanho
      const canvas = await html2canvas(node, {
        backgroundColor: '#fff',
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });
      
      node.style.border = prevBorder;
      node.style.boxShadow = prevBoxShadow;
      
      // Converter com compressão JPEG
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Criar PDF otimizado
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
      
      // Converter PDF para blob
      const pdfBlob = pdf.output('blob');
      
      // Criar mensagem para acompanhar o PDF
      const mensagem = `📋 *REENVIO DO ORÇAMENTO PARA: ${orcamentoSelecionado.cliente_nome.toUpperCase()}*\n\nSegue em anexo a proposta comercial em PDF.`;
      
      // Enviar usando a API correta
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `Orcamento-${orcamentoSelecionado.cliente_nome}-${orcamentoSelecionado.id}.pdf`);
      formData.append('numeros', JSON.stringify([orcamentoSelecionado.cliente_numero]));
      formData.append('mensagem', mensagem);
      formData.append('cliente_nome', info.cliente || orcamentoSelecionado.cliente_nome);
      formData.append('produtos', JSON.stringify(orcamentoSelecionado.produtos));
      formData.append('valor_total', orcamentoSelecionado.valor_total.toString());
      
      console.log('Enviando PDF via API...');
      
      const response = await fetch('/api/enviarPDF', {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.ok) {
        const sucessos = data.resultados?.filter((r: any) => r.status === 'ok')?.length || 0;
        if (sucessos > 0) {
          toast.success(`PDF enviado com sucesso para ${orcamentoSelecionado.cliente_nome.toUpperCase()}!`);
        } else {
          toast.error('Falha ao enviar PDF. Verifique a conexão do WhatsApp.');
        }
        setShowInfoModal(false);
        setOrcamentoSelecionado(null);
        fetchOrcamentos(currentPage); // Recarregar lista
      } else {
        toast.error('Erro ao enviar PDF: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro completo:', error);
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
        fetchOrcamentos(currentPage); // Recarregar lista
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
      case 'enviado': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50';
      case 'reenviado': return 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50';
      case 'erro_envio': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50';
      case 'enviando': return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50';
      default: return 'text-muted-foreground bg-muted border border-border';
    }
  };

  const renderTooltip = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return (
      <span title={text} className="cursor-help">
        {text.substring(0, maxLength)}...
      </span>
    );
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={3500} hideProgressBar={false} theme="auto" />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-card rounded-xl shadow-lg mt-4 border border-border">
        {/* Header com título e indicador visual */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Orçamentos Enviados</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Gerencie e acompanhe todos os orçamentos enviados aos seus clientes. Reenvie propostas quando necessário.
          </p>
        </div>

        {/* Barra de busca e filtros melhorada */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-accent/50 rounded-xl p-6 border border-gray-200 dark:border-border">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {searchTimeout ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 dark:text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Digite para buscar em tempo real: cliente, telefone, produtos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-card text-gray-900 dark:text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="bg-gray-100 dark:bg-secondary hover:bg-gray-200 dark:hover:bg-secondary/90 text-gray-700 dark:text-secondary-foreground px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                disabled={!search && !activeFilter}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpar Filtros
              </button>
            </form>
            
            {/* Filtros rápidos funcionais */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Filtros rápidos:</span>
              <button 
                onClick={() => handleQuickFilter('enviado')}
                className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
                  activeFilter === 'enviado' 
                    ? 'bg-green-500 dark:bg-green-600 text-white shadow-md' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                }`}
              >
                {activeFilter === 'enviado' && '✓ '}Enviados
              </button>
              <button 
                onClick={() => handleQuickFilter('reenviado')}
                className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
                  activeFilter === 'reenviado' 
                    ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-md' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                {activeFilter === 'reenviado' && '✓ '}Reenviados
              </button>
              <button 
                onClick={() => handleQuickFilter('erro_envio')}
                className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
                  activeFilter === 'erro_envio' 
                    ? 'bg-red-500 dark:bg-red-600 text-white shadow-md' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                }`}
              >
                {activeFilter === 'erro_envio' && '✓ '}Com Erro
              </button>
              <button 
                onClick={() => handleQuickFilter('enviando')}
                className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
                  activeFilter === 'enviando' 
                    ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-md' 
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                }`}
              >
                {activeFilter === 'enviando' && '✓ '}Enviando
              </button>
            </div>
            
            {/* Indicador de filtros ativos */}
            {(search || activeFilter) && (
              <div className="mt-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                    </svg>
                    <span className="font-medium">
                      Filtros ativos: 
                      {search && ` Busca: "${search}"`}
                      {activeFilter && ` Status: "${activeFilter}"`}
                    </span>
                  </div>
                  <span className="text-xs text-primary/70">
                    {totalItems} resultado(s) encontrado(s)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de orçamentos melhorada */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {/* Header da tabela */}
          <div className="bg-accent/30 border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Lista de Orçamentos</h2>
              <div className="text-sm text-muted-foreground">
                {totalItems} orçamento(s) encontrado(s)
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('id')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors group"
                    >
                      ID
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                      {sortBy === 'id' && (
                        <span className="text-primary text-sm">
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('cliente_nome')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors group"
                    >
                      Cliente
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                      {sortBy === 'cliente_nome' && (
                        <span className="text-primary text-sm">
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('valor_total')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors group"
                    >
                      Valor Total
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                      {sortBy === 'valor_total' && (
                        <span className="text-primary text-sm">
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('data_criacao')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors group"
                    >
                      Data Criação
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                      {sortBy === 'data_criacao' && (
                        <span className="text-primary text-sm">
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className={`bg-card divide-y divide-border transition-opacity duration-200 ${searchTimeout ? 'opacity-75' : 'opacity-100'}`}>
                {initialLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                        <p className="text-muted-foreground">Carregando orçamentos...</p>
                      </div>
                    </td>
                  </tr>
                ) : orcamentos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-muted/30 rounded-full mb-4">
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">Nenhum orçamento encontrado</p>
                        <p className="text-muted-foreground/70 text-sm mt-1">
                          {search || activeFilter ? 'Tente ajustar os filtros de busca' : 'Ainda não há orçamentos enviados'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orcamentos.map((orc) => (
                    <>
                      <tr key={orc.id} className="hover:bg-accent/20 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-bold text-primary">#{orc.id}</span>
                            </div>
                            <span className="text-sm font-mono text-muted-foreground">{orc.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-bold text-primary">
                                {orc.cliente_nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground max-w-[180px] truncate" title={orc.cliente_nome}>
                                {orc.cliente_nome.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Cliente
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {orc.cliente_numero ? (
                              <>
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm text-foreground">{orc.cliente_numero}</div>
                                  <div className="text-xs text-green-600 dark:text-green-400">WhatsApp</div>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center text-muted-foreground">
                                <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                                <span className="text-sm">Sem contato</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setExpandedOrcamento(expandedOrcamento === orc.id ? null : orc.id)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {orc.produtos.length} produto{orc.produtos.length !== 1 ? 's' : ''}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                R$ {orc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(orc.status)}`}>
                            {orc.status === 'enviado' && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {orc.status === 'reenviado' && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                            {orc.status === 'erro_envio' && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {orc.status === 'enviando' && (
                              <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            {orc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-6 0h6" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm text-foreground">
                                {formatDate(orc.data_criacao).split(' ')[0]}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(orc.data_criacao).split(' ')[1]}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => abrirReenvioMensagem(orc)}
                              disabled={loadingReenvio}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                              title="Reenviar mensagem via WhatsApp"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Mensagem
                            </button>
                            <button
                              onClick={() => abrirReanvioComInfo(orc, 'pdf')}
                              disabled={loadingReenvio}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                              title="Reenviar proposta em PDF"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedOrcamento === orc.id && (
                        <tr>
                          <td colSpan={8} className="px-6 py-6 bg-accent/10 border-l-4 border-primary">
                            <div className="max-w-full">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-foreground flex items-center">
                                  <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                  Detalhes dos Produtos - Orçamento #{orc.id}
                                </h4>
                                <button
                                  onClick={() => setExpandedOrcamento(null)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div className="grid gap-3 max-h-80 overflow-y-auto">
                                {orc.produtos.map((produto, idx) => (
                                  <div key={`produto-${orc.id}-${idx}`} className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-medium text-foreground mb-1 line-clamp-2" title={produto.descricao}>
                                          {produto.descricao}
                                        </h5>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Qtd: <span className="font-medium">{produto.quantidade}</span>
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            Unit: <span className="font-medium">R$ {produto.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                          R$ {produto.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Subtotal</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    Total de {orc.produtos.length} produto{orc.produtos.length !== 1 ? 's' : ''}
                                  </span>
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                      R$ {orc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Valor Total</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação melhorada */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-accent/30 rounded-xl border border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
              <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
              <span className="font-medium text-foreground">{totalItems}</span> orçamentos
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground transition-colors"
                title="Primeira página"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              
              {(() => {
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }
                
                return pages.map(page => (
                  <button
                    key={`page-${page}`}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border hover:bg-accent bg-card text-foreground'
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground transition-colors flex items-center gap-1"
              >
                Próximo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground transition-colors"
                title="Última página"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Modal de reenvio melhorado */}
        {showReenvioModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full mx-4 border border-border max-h-[90vh] overflow-y-auto">
              {/* Header do Modal */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Reenviar Orçamento</h3>
                    <p className="text-primary-foreground/90 text-sm">
                      Para: <span className="font-semibold">{showReenvioModal.cliente_nome.toUpperCase()}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowReenvioModal(null);
                      setContatosSelecionados([]);
                    }}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h4 className="font-semibold text-foreground">Selecionar contatos:</h4>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-accent/10">
                    {contatos.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="font-medium">Nenhum contato disponível</p>
                          <p className="text-sm">Cadastre contatos para poder reenviar</p>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {contatos.map((contato: any) => (
                          <label 
                            key={`modal-contato-${contato.numero}`} 
                            className="flex items-center gap-3 p-4 hover:bg-accent/30 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={contatosSelecionados.includes(contato.numero)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setContatosSelecionados([...contatosSelecionados, contato.numero]);
                                } else {
                                  setContatosSelecionados(contatosSelecionados.filter(n => n !== contato.numero));
                                }
                              }}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {contato.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">{contato.nome}</div>
                                <div className="text-xs text-muted-foreground">{contato.numero}</div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {contatosSelecionados.length > 0 && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 text-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">
                          {contatosSelecionados.length} contato{contatosSelecionados.length !== 1 ? 's' : ''} selecionado{contatosSelecionados.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowReenvioModal(null);
                      setContatosSelecionados([]);
                    }}
                    className="px-6 py-2.5 border border-border rounded-lg hover:bg-accent bg-card text-foreground transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  {tipoEnvio === 'mensagem' && (
                    <button
                      onClick={() => handleReenvio('mensagem')}
                      disabled={contatosSelecionados.length === 0 || loadingReenvio}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                    >
                      {loadingReenvio ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                      {loadingReenvio ? 'Enviando...' : 'Reenviar Mensagem'}
                    </button>
                  )}
                  {tipoEnvio === 'pdf' && (
                    <button
                      onClick={() => handleReenvio('pdf')}
                      disabled={contatosSelecionados.length === 0 || loadingReenvio}
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                    >
                      {loadingReenvio ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {loadingReenvio ? 'Enviando...' : 'Reenviar PDF'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de informações extras melhorado */}
        {(showInfoModal === 'pdf' || showInfoModal === 'whatsapp') && orcamentoSelecionado && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-2xl max-w-md w-full relative border border-border max-h-[90vh] overflow-y-auto">
              {/* Header do Modal */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Informações da Proposta</h3>
                    <p className="text-primary-foreground/90 text-sm">
                      Para: <span className="font-semibold">{orcamentoSelecionado.cliente_nome.toUpperCase()}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Nome do Cliente:
                      </div>
                    </label>
                    <input
                      className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      name="cliente"
                      value={info.cliente}
                      onChange={e => setInfo({ ...info, cliente: e.target.value })}
                      placeholder="Digite o nome do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-6 0h6" />
                        </svg>
                        Validade da Proposta:
                      </div>
                    </label>
                    <input
                      className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      name="validade"
                      value={info.validade}
                      onChange={e => setInfo({ ...info, validade: e.target.value })}
                      placeholder="Ex: 7 dias, 30 dias"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Valor da Entrada:
                      </div>
                    </label>
                    <input
                      className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      name="desconto"
                      value={info.desconto}
                      onChange={e => setInfo({ ...info, desconto: e.target.value })}
                      placeholder="Ex: R$ 1.000,00 ou 10%"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Forma de Pagamento:
                      </div>
                    </label>
                    <input
                      className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      name="pagamento"
                      value={info.pagamento}
                      onChange={e => setInfo({ ...info, pagamento: e.target.value })}
                      placeholder="Ex: À vista, Parcelado, PIX"
                    />
                  </div>
                </div>

                {/* Resumo do orçamento */}
                <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Resumo do Orçamento
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Orçamento ID:</span>
                      <span className="font-mono">#{orcamentoSelecionado.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produtos:</span>
                      <span>{orcamentoSelecionado.produtos.length} item{orcamentoSelecionado.produtos.length !== 1 ? 'ns' : ''}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground pt-2 border-t border-border">
                      <span>Total:</span>
                      <span className="text-green-600 dark:text-green-400">
                        R$ {orcamentoSelecionado.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium transition-colors"
                    onClick={() => setShowInfoModal(false)}
                  >
                    Cancelar
                  </button>
                  
                  {showInfoModal === 'pdf' && (
                    <>
                      <button
                        className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
                        onClick={enviarPDFDireto}
                        disabled={loadingReenvio}
                      >
                        {loadingReenvio ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                        {loadingReenvio ? 'Enviando...' : 'Enviar PDF via WhatsApp'}
                      </button>
                      <button
                        className="px-4 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                        onClick={async () => {
                          if (!propostaRef.current || !orcamentoSelecionado) return toast.error('Erro ao gerar PDF');
                          const node = propostaRef.current;
                          const prevBorder = node.style.border;
                          const prevBoxShadow = node.style.boxShadow;
                          node.style.border = 'none';
                          node.style.boxShadow = 'none';
                          node.style.outline = 'none';
                          try {
                            const canvas = await html2canvas(node, {
                              backgroundColor: '#fff',
                              scale: 1.5,
                              useCORS: true,
                              logging: false,
                              width: node.scrollWidth,
                              height: node.scrollHeight,
                            });
                            
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

                            pdf.save(`Orcamento-${orcamentoSelecionado.cliente_nome}-${orcamentoSelecionado.id}.pdf`);
                            toast.success('PDF baixado com sucesso!');
                          } catch (e) {
                            toast.error('Erro ao baixar PDF: ' + e);
                          } finally {
                            node.style.border = prevBorder;
                            node.style.boxShadow = prevBoxShadow;
                          }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Baixar PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Renderização invisível do PropostaComercial para gerar PDF */}
        {orcamentoSelecionado && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0, border: 'none', boxShadow: 'none', outline: 'none' }}>
            <div ref={propostaRef} className="rounded-none shadow-none border-none isolate">
              <PropostaComercial
                cliente={info.cliente || orcamentoSelecionado.cliente_nome}
                validade={info.validade || '7 dias'}
                desconto={Number(info.desconto) || 0}
                pagamento={info.pagamento || 'À vista'}
                orcamento={orcamentoSelecionado.produtos}
                total={orcamentoSelecionado.valor_total}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
