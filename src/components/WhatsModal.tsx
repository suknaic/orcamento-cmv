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
      <div className="bg-white rounded shadow-lg p-8 max-w-md w-full relative flex flex-col items-center">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
          onClick={onClose}
          title="Fechar"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Status do WhatsApp</h2>
        {whatsConnected ? (
          <img
            src={check}
            alt="WhatsApp conectado"
            className="w-64 h-64 border rounded shadow-lg bg-green-100 p-8"
          />
        ) : qr ? (
          <img
            src={qr}
            alt="QR Code do WhatsApp"
            className="w-64 h-64 border rounded shadow-lg"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-gray-100 border rounded animate-pulse">
            <div className="w-32 h-32 bg-gray-300 rounded" />
          </div>
        )}
        {message && <p className="mt-4 text-lg font-semibold text-center">{message}</p>}
        <button
          className="mt-6 px-4 py-2 rounded bg-yellow-500 text-white font-semibold hover:bg-yellow-600 border border-yellow-700"
          onClick={onReconnect}
          title="Reconectar WhatsApp"
        >
          Reconectar WhatsApp
        </button>
      </div>
    </div>
  );
}
