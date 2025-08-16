import React from 'react';
import { useOrcamentoContext } from '../contexts/OrcamentoContext';

export function ConfirmNameModal() {
  const {
    showConfirmaNomeModal,
    setShowConfirmaNomeModal,
    nomeTemporario,
    setNomeTemporario,
    loadingEnviar,
    enviarMensagemWhatsApp
  } = useOrcamentoContext();

  if (!showConfirmaNomeModal) return null;

  return (
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
              }
            }}
            disabled={!nomeTemporario.trim() || loadingEnviar}
          >
            {loadingEnviar && (
              <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loadingEnviar ? "Enviando..." : "Enviar Mensagem"}
          </button>
        </div>
      </div>
    </div>
  );
}
