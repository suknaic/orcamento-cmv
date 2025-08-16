import check from "../check.svg";

interface WhatsModalProps {
  show: boolean;
  onClose: () => void;
  whatsConnected: boolean;
  qr: string | null;
  message: string | null;
  onReconnect: () => Promise<void>;
}

export function WhatsModal({ show, onClose, whatsConnected, qr, message, onReconnect }: WhatsModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full relative flex flex-col items-center border border-border max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className={`w-full p-6 rounded-t-xl ${whatsConnected ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-primary to-primary/80'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${whatsConnected ? 'bg-white/20' : 'bg-white/20'}`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Status do WhatsApp</h2>
                <p className="text-white/90 text-sm">
                  {whatsConnected ? 'Conectado e funcionando' : 'Aguardando conexão'}
                </p>
              </div>
            </div>
            <button
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              onClick={onClose}
              title="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        </div>
        
        <div className="p-6 w-full flex flex-col items-center">
        {whatsConnected ? (
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700/50 rounded-xl shadow-lg p-8 flex items-center justify-center">
              <img
                src={check}
                alt="WhatsApp conectado"
                className="w-32 h-32 object-contain"
              />
            </div>
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50 w-full">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">WhatsApp conectado com sucesso!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Você pode enviar orçamentos normalmente.
              </p>
            </div>
          </div>
        ) : qr ? (
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 bg-white border-2 border-border rounded-xl shadow-lg p-4 flex items-center justify-center">
              <img
                src={qr}
                alt="QR Code do WhatsApp"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50 w-full">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold">Escaneie o QR Code</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Abra o WhatsApp no seu celular e escaneie este código.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/30 rounded-xl animate-pulse">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted-foreground/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground/50 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-muted-foreground font-medium">Carregando QR Code...</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50 w-full">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Aguarde um momento</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Gerando código QR para conexão...
              </p>
            </div>
          </div>
        )}
        {message && (
          <div className="mt-4 p-3 bg-accent rounded-lg border border-border w-full text-center">
            <p className="text-sm font-medium text-foreground">{message}</p>
          </div>
        )}
        
        <div className="flex gap-3 mt-6 w-full">
          <button
            className="flex-1 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium transition-colors border border-border"
            onClick={onClose}
          >
            Fechar
          </button>
          {!whatsConnected && (
            <button
              className="flex-1 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors flex items-center justify-center gap-2"
              onClick={onReconnect}
              title="Reconectar WhatsApp"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reconectar
            </button>
          )}
        </div>
        </div>
    </div>
  );
}
