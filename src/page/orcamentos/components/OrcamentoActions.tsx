import React from 'react';
import { useOrcamentoContext } from '../contexts/OrcamentoContext';
import { AnimatedSubscribeButton } from '@/components/magicui/animated-subscribe-button';

export function OrcamentoActions() {
  const {
    copiado,
    copiarOrcamento,
    abrirModalContatos,
    setShowInfoModal,
    setShowContatosModal, // Adicione esta linha para obter a função
  } = useOrcamentoContext();

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Enviar Orçamento
            </h2>
            <p className="text-sm text-muted-foreground">
              Escolha a forma de compartilhar sua proposta comercial
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group flex flex-col h-full">
            <div className="text-center mb-4 flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3 group-hover:bg-accent transition-colors">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-foreground mb-2">Copiar Texto</h3>
              <p className="text-sm text-muted-foreground">
                Copia o orçamento para usar em qualquer lugar
              </p>
            </div>
            <AnimatedSubscribeButton
              subscribeStatus={copiado}
              onClick={copiarOrcamento}
              className="w-full bg-muted hover:bg-accent text-foreground border border-border px-6 py-[38] rounded-xl font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg min-h-[56px]"
            >
              <span>Copiar Orçamento</span>
              <span>✅ Copiado!</span>
            </AnimatedSubscribeButton>
          </div>

          <div className="group flex flex-col h-full">
            <div className="text-center mb-4 flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-foreground mb-2">Mensagem WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Envia mensagem de texto via WhatsApp
              </p>
            </div>
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg min-h-[56px]"
              type="button"
              onClick={() => abrirModalContatos('texto')}
            >
              Enviar por WhatsApp
            </button>
          </div>

          <div className="group flex flex-col h-full">
            <div className="text-center mb-4 flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-foreground mb-2">Proposta <br /> PDF</h3>
              <p className="text-sm text-muted-foreground">
                Gera PDF profissional e envia via WhatsApp
              </p>
            </div>
            <button
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg min-h-[56px]"
              type="button"
              onClick={() => {
                setShowInfoModal(true); // Abre o modal de informações do PDF
                // Nota: A continuação do fluxo (abrir modal de contatos) acontece dentro do InfoModal.
              }}
            >
              Gerar e Enviar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
