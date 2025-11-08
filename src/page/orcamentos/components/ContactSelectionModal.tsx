import React from 'react';
import { useOrcamentoContext } from '../contexts/OrcamentoContext';

export function ContactSelectionModal() {
  const {
    showModal,
    setShowModal,
    contatos,
    contatoSelecionado,
    setContatoSelecionado: setContatoSelecionado,
    buscaContato,
    setBuscaContato,
    loadingEnviar,
    handleSelectContato,
    confirmarEnvioMensagem,
    enviarPDFWhatsApp,
    tipoEnvio // Usar o estado correto que define o tipo de envio
  } = useOrcamentoContext();

  if (!showModal) return null;

  // Determina qual função de envio usar com base no contexto
  const handleEnviarClick = () => {
    console.log("[ContactSelectionModal] Clique no botão de envio, modo:", tipoEnvio);
    console.log("[ContactSelectionModal] Contato selecionado:", contatoSelecionado);

    // Se o modal foi aberto a partir do fluxo de PDF, usa a função de PDF
    if (tipoEnvio === "pdf") {
      console.log("[ContactSelectionModal] Chamando função enviarPDFWhatsApp()");
      enviarPDFWhatsApp();
    } else {
      // Caso contrário, usa o fluxo de mensagem normal
      console.log("[ContactSelectionModal] Chamando função confirmarEnvioMensagem()");
      confirmarEnvioMensagem();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full border border-border overflow-hidden">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Selecionar Contatos
              </h3>
              <p className="text-sm text-muted-foreground">
                Escolha os contatos que receberão o {tipoEnvio === "pdf" ? "PDF" : "orçamento"}
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
                Selecione um Contato
              </label>
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
                  .filter((contato: any) => {
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
                  .map((contato: any) => (
                    <button
                      key={`contato-${contato.numero}-${contato.nome || "sem-nome"}`}
                      onClick={() => handleSelectContato(contato)}
                      className={`flex items-center w-full text-left gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${contatoSelecionado?.numero === contato.numero
                          ? 'bg-primary/10 border-2 border-primary/30'
                          : 'bg-background border border-border hover:border-primary/50'
                        }`}
                    >
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
                    </button>
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
              setContatoSelecionado(null);
            }}
          >
            Cancelar
          </button>

          <button
            className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!contatoSelecionado || loadingEnviar}
            onClick={handleEnviarClick}
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
                Enviando...
              </>
            ) : (
              `Enviar ${tipoEnvio === "pdf" ? "PDF" : "mensagem"}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
