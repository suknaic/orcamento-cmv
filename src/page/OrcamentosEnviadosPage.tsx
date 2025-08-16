import { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import { PropostaComercial } from "@/components/proposta";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [search, setSearch] = useState('');
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

  const fetchOrcamentos = async (page = 1, searchTerm = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        sortBy,
        sortOrder
      });
      
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
    }
    setLoading(false);
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
    fetchOrcamentos();
    fetchStats();
  }, [sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrcamentos(1, search);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchOrcamentos(page);
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
        toast.success(`Mensagem reenviada para ${orcamento.cliente_nome}!`);
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
      const mensagem = `📋 *REENVIO DO ORÇAMENTO*\n\nSegue em anexo a proposta comercial em PDF.`;
      
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
          toast.success(`PDF enviado com sucesso para ${orcamentoSelecionado.cliente_nome}!`);
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
      case 'enviado': return 'text-green-600 bg-green-100';
      case 'reenviado': return 'text-blue-600 bg-blue-100';
      case 'erro_envio': return 'text-red-600 bg-red-100';
      case 'enviando': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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
        <h1 className="text-3xl font-extrabold mb-6 text-foreground tracking-tight text-center">Orçamentos Enviados</h1>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Total de Orçamentos</h3>
            <p className="text-3xl font-bold">{stats.totalOrcamentos}</p>
            <p className="text-sm opacity-90">
              {stats.orcamentosEnviados} enviados • {stats.orcamentosCriados} criados
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Ganhos Possíveis</h3>
            <p className="text-3xl font-bold">
              R$ {stats.valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-90">
              Média: R$ {stats.valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Busca e filtros */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por cliente, número ou produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>

        {/* Tabela de orçamentos */}
        <div className="overflow-x-auto bg-card rounded-lg shadow border border-border">
          <table className="min-w-full">
            <thead className="bg-accent border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('id')}
                    className="flex items-center gap-1 font-medium text-foreground hover:text-primary"
                  >
                    ID
                    {sortBy === 'id' && (
                      <span className="text-primary">
                        {sortOrder === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('cliente_nome')}
                    className="flex items-center gap-1 font-medium text-foreground hover:text-primary"
                  >
                    Cliente
                    {sortBy === 'cliente_nome' && (
                      <span className="text-primary">
                        {sortOrder === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Contato</th>
                <th className="px-4 py-3 text-left">Produtos</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('valor_total')}
                    className="flex items-center gap-1 font-medium text-foreground hover:text-primary"
                  >
                    Valor
                    {sortBy === 'valor_total' && (
                      <span className="text-primary">
                        {sortOrder === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('data_criacao')}
                    className="flex items-center gap-1 font-medium text-foreground hover:text-primary"
                  >
                    Data Criação
                    {sortBy === 'data_criacao' && (
                      <span className="text-primary">
                        {sortOrder === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando orçamentos...
                  </td>
                </tr>
              ) : orcamentos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum orçamento encontrado
                  </td>
                </tr>
              ) : (
                orcamentos.map((orc) => (
                  <>
                    <tr key={orc.id} className="hover:bg-accent/50">
                      <td className="px-4 py-3 text-sm font-mono">#{orc.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {renderTooltip(orc.cliente_nome, 20)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {orc.cliente_numero || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setExpandedOrcamento(expandedOrcamento === orc.id ? null : orc.id)}
                          className="text-primary hover:text-primary/80 underline"
                        >
                          {orc.produtos.length} produto(s)
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        R$ {orc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orc.status)}`}>
                          {orc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(orc.data_criacao)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => abrirReenvioMensagem(orc)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium"
                            title="Reenviar Mensagem"
                          >
                            Msg
                          </button>
                          <button
                            onClick={() => abrirReanvioComInfo(orc, 'pdf')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium"
                            title="Reenviar PDF"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrcamento === orc.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-accent/30">
                          <div className="max-w-4xl">
                            <h4 className="font-semibold mb-2 text-foreground">Produtos do Orçamento:</h4>
                            <div className="grid gap-2 text-sm">
                              {orc.produtos.map((produto, idx) => (
                                <div key={idx} className="border-l-4 border-primary pl-3">
                                  <div className="font-medium text-foreground" title={produto.descricao}>
                                    {produto.descricao}
                                  </div>
                                  <div className="text-muted-foreground">
                                    Qtd: {produto.quantidade} • Valor Unit: R$ {produto.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Total: R$ {produto.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              ))}
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground"
            >
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent bg-card text-foreground'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground"
            >
              Próximo
            </button>
            
            <span className="text-sm text-muted-foreground ml-4">
              Página {currentPage} de {totalPages} ({totalItems} itens)
            </span>
          </div>
        )}

        {/* Modal de reenvio */}
        {showReenvioModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">
                Reenviar Orçamento para: {showReenvioModal.cliente_nome}
              </h3>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-foreground">Selecionar contatos:</h4>
                <div className="max-h-60 overflow-y-auto border border-border rounded p-2 bg-card">
                  {contatos.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum contato disponível</p>
                  ) : (
                    contatos.map((contato: any) => (
                      <label key={contato.numero} className="flex items-center gap-2 p-1 hover:bg-accent text-foreground">
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
                        />
                        <span className="text-sm">{contato.nome} ({contato.numero})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowReenvioModal(null);
                    setContatosSelecionados([]);
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent bg-card text-foreground"
                >
                  Cancelar
                </button>
                {tipoEnvio === 'mensagem' && (
                  <button
                    onClick={() => handleReenvio('mensagem')}
                    disabled={contatosSelecionados.length === 0 || loadingReenvio}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingReenvio ? 'Enviando...' : 'Reenviar Mensagem'}
                  </button>
                )}
                {tipoEnvio === 'pdf' && (
                  <button
                    onClick={() => handleReenvio('pdf')}
                    disabled={contatosSelecionados.length === 0 || loadingReenvio}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingReenvio ? 'Enviando...' : 'Reenviar PDF'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de informações extras */}
        {(showInfoModal === 'pdf' || showInfoModal === 'whatsapp') && orcamentoSelecionado && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-card rounded shadow-lg p-8 max-w-md w-full relative border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">Informações extras - {orcamentoSelecionado.cliente_nome}</h3>
              <div className="flex flex-col gap-3">
                <label className="text-foreground">
                  Cliente:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="cliente"
                    value={info.cliente}
                    onChange={e => setInfo({ ...info, cliente: e.target.value })}
                  />
                </label>
                <label className="text-foreground">
                  Validade da proposta:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="validade"
                    value={info.validade}
                    onChange={e => setInfo({ ...info, validade: e.target.value })}
                  />
                </label>
                <label className="text-foreground">
                  Entrada:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="desconto"
                    value={info.desconto}
                    onChange={e => setInfo({ ...info, desconto: e.target.value })}
                  />
                </label>
                <label className="text-foreground">
                  Forma de pagamento:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="pagamento"
                    value={info.pagamento}
                    onChange={e => setInfo({ ...info, pagamento: e.target.value })}
                  />
                </label>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  className="px-4 py-2 rounded bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  onClick={() => setShowInfoModal(false)}
                >
                  Cancelar
                </button>
                
                {showInfoModal === 'pdf' && (
                  <>
                    <button
                      className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center gap-2"
                      onClick={enviarPDFDireto}
                      disabled={loadingReenvio}
                    >
                      {loadingReenvio && (
                        <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      )}
                      {loadingReenvio ? 'Enviando...' : `Enviar PDF para ${orcamentoSelecionado?.cliente_nome}`}
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-gray-800 text-white font-semibold hover:bg-gray-900"
                      onClick={async () => {
                        if (!propostaRef.current || !orcamentoSelecionado) return toast.error('Erro ao gerar PDF');
                        const node = propostaRef.current;
                        const prevBorder = node.style.border;
                        const prevBoxShadow = node.style.boxShadow;
                        node.style.border = 'none';
                        node.style.boxShadow = 'none';
                        node.style.outline = 'none';
                        try {
                          // Configurações otimizadas para performance e tamanho
                          const canvas = await html2canvas(node, {
                            backgroundColor: '#fff',
                            scale: 1.5, // Reduzido para melhor performance
                            useCORS: true,
                            logging: false,
                            width: node.scrollWidth,
                            height: node.scrollHeight,
                          });
                          
                          // Converter com compressão JPEG para reduzir tamanho
                          const imgData = canvas.toDataURL('image/jpeg', 0.8); // 80% de qualidade
                          
                          // Criar PDF otimizado
                          const pdf = new jsPDF('p', 'mm', 'a4');
                          const imgWidth = 210; // A4 width in mm
                          const pageHeight = 297; // A4 height in mm
                          const imgHeight = (canvas.height * imgWidth) / canvas.width;
                          let heightLeft = imgHeight;
                          let position = 0;

                          // Adicionar primeira página
                          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                          heightLeft -= pageHeight;

                          // Adicionar páginas adicionais se necessário
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
                      Baixar PDF
                    </button>
                  </>
                )}
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
