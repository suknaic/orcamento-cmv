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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card rounded shadow-lg p-8 max-w-md w-full relative flex flex-col items-center border border-border">
        <button
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-2xl font-bold"
          onClick={onClose}
          title="Fechar"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-foreground">Status do WhatsApp</h2>
        {whatsConnected ? (
          <img
            src={check}
            alt="WhatsApp conectado"
            className="w-64 h-64 border border-border rounded shadow-lg bg-green-100 dark:bg-green-900/20 p-8"
          />
        ) : qr ? (
          <img
            src={qr}
            alt="QR Code do WhatsApp"
            className="w-64 h-64 border border-border rounded shadow-lg bg-card"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-muted border border-border rounded animate-pulse">
            <div className="w-32 h-32 bg-muted-foreground/20 rounded" />
          </div>
        )}
        {message && <p className="mt-4 text-lg font-semibold text-center text-foreground">{message}</p>}
        <button
          className="mt-6 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold border border-yellow-600 transition-colors"
          onClick={onReconnect}
          title="Reconectar WhatsApp"
        >
          Reconectar WhatsApp
        </button>
      </div>
    </div>
  );
}
