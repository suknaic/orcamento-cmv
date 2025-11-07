/**
 * WhatsModal - Componente de modal para exibir o QR Code do WhatsApp
 * 
 * Busca o último QR code gerado diretamente do backend quando o componente é montado,
 * garantindo que ele continue disponível mesmo quando a página é recarregada (F5).
 * 
 * O QR code é mantido pelo backend e atualizado periodicamente, com o frontend apenas
 * exibindo a versão mais recente disponível.
 */
import check from "../assets/check.svg";
import { useState } from "react";

interface WhatsModalProps {
  show: boolean;
  onClose: () => void;
  whatsConnected: boolean;
  qr: string | null;
  message: string | null;
  onReconnect: () => Promise<void>;
}

export function WhatsModal({ show, onClose, whatsConnected, qr, message, onReconnect }: WhatsModalProps) {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    
    try {
      // Chamar a função de reconexão
      await onReconnect();
      
      // Resetar o estado após um tempo
      setTimeout(() => {
        setIsReconnecting(false);
      }, 5000);
    } catch (error) {
      console.error("Erro ao reconectar WhatsApp:", error);
      setIsReconnecting(false);
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full relative border border-border">
        {/* Header do Modal */}
        <div className={`relative p-4 text-center ${whatsConnected ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
          <button
            className="absolute top-2 right-2 text-white/80 hover:text-white p-1 rounded-full"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className="text-xl font-bold">Status do BOT-Orçamento</h2>
          <p className="text-white/90 text-sm">
            {whatsConnected ? '✓ Conectado' : '⏳ Aguardando conexão'}
          </p>
        </div>
        
        {/* Conteúdo Principal */}
        <div className="p-4">
          {/* QR Code ou Status */}
          <div className="flex justify-center mb-4">
            {whatsConnected ? (
              <div className="w-32 h-32 border-4 border-green-200 rounded-lg flex items-center justify-center bg-green-50">
                <img
                  src={check}
                  alt="WhatsApp conectado"
                  className="w-16 h-16"
                />
              </div>
            ) : (qr && qr.startsWith('data:image')) ? (
              <div className="w-48 h-48 border-2 border-border rounded-lg p-2">
                <img
                  src={qr}
                  alt="QR Code do WhatsApp"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <svg className="w-10 h-10 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p>Inicializando...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Mensagem de Status */}
          {message && (
            <div className="mb-4 p-3 bg-muted rounded text-center">
              <p className="text-sm">{message}</p>
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              className="flex-1 px-4 py-2 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              onClick={onClose}
            >
              Fechar
            </button>
            {!whatsConnected && (
              <button
                className="flex-1 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                {isReconnecting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Reconectando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reconectar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
