import React from "react";
import { useEnviadosContext } from "../contexts/EnviadosContext";

export function SearchAndFilters() {
  const {
    search,
    setSearch,
    activeFilter,
    searchTimeout,
    totalItems,
    handleQuickFilter,
    clearAllFilters
  } = useEnviadosContext();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="mb-6">
      <div className="bg-accent/30 rounded-xl p-6 border border-border">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {searchTimeout ? (
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <input
                type="text"
                placeholder="Digite para buscar em tempo real: cliente, telefone, produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-muted-foreground hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={clearAllFilters}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
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
          <span className="text-sm font-medium text-muted-foreground">Filtros rápidos:</span>
          <button 
            onClick={() => handleQuickFilter('enviado')}
            className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
              activeFilter === 'enviado' 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
            }`}
          >
            {activeFilter === 'enviado' && '✓ '}Enviados
          </button>
          <button 
            onClick={() => handleQuickFilter('reenviado')}
            className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
              activeFilter === 'reenviado' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            }`}
          >
            {activeFilter === 'reenviado' && '✓ '}Reenviados
          </button>
          <button 
            onClick={() => handleQuickFilter('erro_envio')}
            className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
              activeFilter === 'erro_envio' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
            }`}
          >
            {activeFilter === 'erro_envio' && '✓ '}Com Erro
          </button>
          <button 
            onClick={() => handleQuickFilter('enviando')}
            className={`px-3 py-1 text-xs rounded-full hover:scale-105 transition-all ${
              activeFilter === 'enviando' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
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
  );
}
