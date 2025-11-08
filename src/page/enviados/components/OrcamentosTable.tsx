import React from "react";
import { useEnviadosContext } from "../contexts/EnviadosContext";

export function OrcamentosTable() {
  const {
    orcamentos,
    initialLoading,
    totalItems,
    searchTimeout,
    expandedOrcamento,
    setExpandedOrcamento,
    handleSort,
    sortBy,
    sortOrder,
    abrirReenvioMensagem,
    abrirReanvioComInfo,
    loadingReenvio,
    formatDate,
    getStatusColor
  } = useEnviadosContext();

  if (initialLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-accent/30 border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Lista de Orçamentos</h2>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-muted-foreground">Carregando orçamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (orcamentos.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-accent/30 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Lista de Orçamentos</h2>
            <div className="text-sm text-muted-foreground">
              {totalItems} orçamento(s) encontrado(s)
            </div>
          </div>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-foreground text-lg font-medium">Nenhum orçamento encontrado</p>
            <p className="text-muted-foreground text-sm mt-1">
              Ainda não há orçamentos enviados
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com controles de ordenação */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Lista de Orçamentos</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {totalItems} orçamento(s) encontrado(s)
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSort('id')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  sortBy === 'id' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                ID {sortBy === 'id' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('cliente_nome')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  sortBy === 'cliente_nome' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                Cliente {sortBy === 'cliente_nome' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('valor_total')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  sortBy === 'valor_total' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                Valor {sortBy === 'valor_total' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('data_criacao')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  sortBy === 'data_criacao' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                Data {sortBy === 'data_criacao' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className={`space-y-4 transition-opacity duration-200 ${searchTimeout ? 'opacity-75' : 'opacity-100'}`}>
        {orcamentos.map((orc) => (
          <div
            key={orc.id}
            className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all duration-200"
          >
            {/* Header do Card */}
            <div className="p-6 border-b border-border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">#{orc.id}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{orc.cliente_nome.toUpperCase()}</h3>
                    <p className="text-sm text-muted-foreground">Orçamento #{orc.id}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orc.status)}`}>
                    {orc.status === 'enviado' && (
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {orc.status === 'reenviado' && (
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {orc.status === 'erro_envio' && (
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {orc.status === 'enviando' && (
                      <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {orc.status}
                  </span>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      R$ {orc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Contato */}
                <div className="flex items-center gap-3">
                  {orc.cliente_numero ? (
                    <>
                      <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{orc.cliente_numero}</div>
                        <div className="text-xs text-primary">WhatsApp</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-muted border border-border rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Sem contato</div>
                        <div className="text-xs text-muted-foreground">N/A</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Produtos */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent border border-border rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {orc.produtos.length} produto{orc.produtos.length !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => setExpandedOrcamento(expandedOrcamento === orc.id ? null : orc.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {expandedOrcamento === orc.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                  </div>
                </div>

                {/* Data */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted border border-border rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {formatDate(orc.data_criacao).split(' ')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(orc.data_criacao).split(' ')[1]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => abrirReenvioMensagem(orc)}
                  disabled={loadingReenvio}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  title="Reenviar mensagem via WhatsApp"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Reenviar Mensagem
                </button>
                <button
                  onClick={() => abrirReanvioComInfo(orc, 'pdf')}
                  disabled={loadingReenvio}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  title="Reenviar proposta em PDF"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Enviar PDF
                </button>
              </div>
            </div>

            {/* Seção expandida com detalhes dos produtos */}
            {expandedOrcamento === orc.id && (
              <div className="border-t border-border bg-accent/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-foreground flex items-center">
                    <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Detalhes dos Produtos
                  </h4>
                  <button
                    onClick={() => setExpandedOrcamento(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid gap-3 max-h-80 overflow-y-auto">
                  {orc.produtos.map((produto, idx) => (
                    <div key={`produto-${orc.id}-${idx}`} className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-foreground mb-2" title={produto.descricao}>
                            {produto.descricao}
                          </h5>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Qtd: <span className="font-medium text-foreground">{produto.quantidade}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Unit: <span className="font-medium text-foreground">R$ {produto.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right sm:ml-4">
                          <div className="text-lg font-semibold text-primary">
                            R$ {produto.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Total de {orc.produtos.length} produto{orc.produtos.length !== 1 ? 's' : ''}
                    </span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        R$ {orc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">Valor Total</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
