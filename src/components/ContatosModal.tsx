import { useState, useEffect } from "react";

interface Contato {
  nome: string;
  numero: string;
}

interface ContatosModalProps {
  show: boolean;
  onClose: () => void;
  onSelectContato: (contato: Contato) => void;
  titulo?: string;
}

export function ContatosModal({ show, onClose, onSelectContato, titulo = "Selecione um contato" }: ContatosModalProps) {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    if (show) {
      carregarContatos();
    }
  }, [show]);

  const carregarContatos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contatos", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
      });

      const data = await response.json();

      if (response.ok && data.contatos) {
        setContatos(data.contatos);
      } else {
        const errorMsg = data.error || "Erro ao carregar contatos";
        console.error("Erro ao carregar contatos:", errorMsg);
        setError(errorMsg);
        setContatos([]);
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
      setError(error instanceof Error ? error.message : "Erro ao carregar contatos");
      setContatos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectContato = (contato: Contato) => {
    onSelectContato(contato);
    onClose();
  };

  const contatosFiltrados = contatos.filter(
    (contato) =>
      contato.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      contato.numero.includes(filtro)
  );

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col relative overflow-hidden border border-border">
        {/* Header do Modal */}
        <div className="relative p-6 text-center bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-all duration-200 p-2 hover:bg-white/10 rounded-full"
            onClick={onClose}
            title="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-1">{titulo}</h2>
          </div>
        </div>
        
        {/* Campo de busca */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-10 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20"
              placeholder="Buscar contato..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        
        {/* Lista de contatos */}
        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center">
                <svg
                  className="w-10 h-10 text-green-500 animate-spin mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-muted-foreground">Carregando contatos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar contatos</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button
                  onClick={carregarContatos}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : contatosFiltrados.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum contato encontrado</h3>
                <p className="text-muted-foreground">
                  {contatos.length > 0
                    ? "Tente outra palavra na busca"
                    : "Você ainda não tem conversas no WhatsApp"}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {contatosFiltrados.map((contato) => (
                <li key={contato.numero} className="hover:bg-muted/50">
                  <button
                    className="flex items-center w-full p-4 text-left transition-colors"
                    onClick={() => handleSelectContato(contato)}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 text-green-600 dark:text-green-400 flex-shrink-0">
                      <span className="font-semibold text-sm">
                        {contato.nome.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{contato.nome}</h3>
                      <p className="text-muted-foreground text-sm truncate">
                        {contato.numero}
                      </p>
                    </div>
                    <div className="ml-2 text-green-600 dark:text-green-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-4 border-t border-border">
          <button
            className="w-full py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium transition-colors"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}