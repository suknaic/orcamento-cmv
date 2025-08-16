import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

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

  const abrirReenvioModal = async (orcamento: Orcamento) => {
    try {
      const res = await fetch("/api/contatos");
      const lista = await res.json();
      setContatos(lista);
      setShowReenvioModal(orcamento);
      setContatosSelecionados(orcamento.cliente_numero ? [orcamento.cliente_numero] : []);
    } catch (e) {
      toast.error("Erro ao buscar contatos: " + e);
    }
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
                        <button
                          onClick={() => abrirReenvioModal(orc)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded text-xs font-medium"
                        >
                          Reenviar
                        </button>
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
                <button
                  onClick={() => handleReenvio('mensagem')}
                  disabled={contatosSelecionados.length === 0 || loadingReenvio}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingReenvio ? 'Enviando...' : 'Reenviar Mensagem'}
                </button>
                <button
                  onClick={() => handleReenvio('pdf')}
                  disabled={contatosSelecionados.length === 0 || loadingReenvio}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingReenvio ? 'Enviando...' : 'Reenviar PDF'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
