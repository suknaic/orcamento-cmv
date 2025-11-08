import { useEffect, useState, useCallback, useRef } from "react";
import { OrcamentoPage } from "./page/orcamentos/";
import { ProdutosCrudPage } from "./page/produtos";
import { OrcamentosEnviadosPage } from "./page/enviados";
import check from "./assets/check.svg";
import { io, Socket } from "socket.io-client";
import { Routes, Route } from "react-router-dom";

import { Header } from "./components/Header";
import { WhatsModal } from "./components/WhatsModal";
import { Sidebar } from "./components/Sidebar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./hooks/useTheme";

// Tipos para o Socket
interface ServerToClientEvents {
  qr: (data: string) => void;
  message: (msg: string) => void;
  connected: () => void;
  authenticated: (msg: string) => void;
  ready: (msg: string) => void;
  statusOrcamento: (data: { status: string; mensagem: string }) => void;
  'whatsapp-status': (isConnected: boolean) => void;
}

interface ClientToServerEvents {
  clientReady: () => void;
  enviarOrcamento: (data: any) => void;
  'reconnect-bot': () => void;
  'get-whatsapp-status': () => void; // Novo evento para solicitar status
}

export function App() {
  // Refs para prevenir atualizações desnecessárias
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  
  // Estado para sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado para QRCode, status e modal do WhatsApp
  const [qr, setQr] = useState<string | null>(null);
  const [whatsConnected, setWhatsConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showWhatsModal, setShowWhatsModal] = useState(false);

  // Estado do formulário
  const [form, setForm] = useState({
    largura: "",
    altura: "",
    material: "",
    acabamento: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [orcamento, setOrcamento] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState<string | null>(null);
  
  // Estado para materiais e acabamentos vindos do backend
  const [materiais, setMateriais] = useState<{ nome: string; preco: number }[]>([]);
  const [acabamentos, setAcabamentos] = useState<{ nome: string; preco: number }[]>([]);
  
  // Buscar materiais e acabamentos do backend
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setMateriais(data.materiais || []);
        setAcabamentos(data.acabamentos || []);
      })
      .catch(err => console.error("Erro ao buscar configurações:", err));
  }, []);

  // Conexão com socket.io - usando uma abordagem mais estável com useEffect
  useEffect(() => {
    // Criamos a instância do socket apenas uma vez e armazenamos na ref
    const socket = io("http://localhost:3001");
    socketRef.current = socket as Socket<ServerToClientEvents, ClientToServerEvents>;
    
    // Configurando os event listeners
    socket.on("qr", (data: string) => {
      console.log("QR recebido", typeof data === 'string' && data.length > 20 ? data.substring(0, 20) + "..." : data);
      setQr(data);
      setWhatsConnected(false); // Certifica-se de que o status está como desconectado quando recebe um QR
    });
    
    socket.on("message", (msg: string) => {
      console.log("Mensagem recebida:", msg);
      setMessage(msg);
    });
    
    socket.on("connected", () => {
      setWhatsConnected(true);
      setQr(check);
      setMessage("© BOT-Orçamento - Dispositivo conectado!");
    });
    
    socket.on("authenticated", (msg: string) => {
      console.log("WhatsApp autenticado:", msg);
      setMessage(msg);
    });
    
    socket.on("ready", (msg: string) => {
      console.log("WhatsApp pronto (evento ready):", msg);
      setWhatsConnected(true);
      setQr(check);
      setMessage(msg || "© BOT-Orçamento - Dispositivo pronto e operacional!");
    });
    
    socket.on("statusOrcamento", (res: any) => {
      console.log("Status do orçamento:", res);
      setStatusEnvio(res.status === "enviado" ? res.mensagem : `Falha: ${res.mensagem}`);
      setLoading(false);
    });
    
    socket.on("whatsapp-status", (isConnected: boolean) => {
      console.log("Status do WhatsApp atualizado:", isConnected);
      setWhatsConnected(isConnected);
      // Se conectado, vamos garantir que o estado do qr reflita isso
      if (isConnected) {
        setQr(check); // Usando a importação do check.svg já existente
      }
    });
    
    console.log("Socket.IO conectado");
    
    // Quando conectar, solicitar o estado atual do WhatsApp
    socket.emit("clientReady");
    
    // Cleanup function para remover event listeners e desconectar socket
    return () => {
      socket.off("qr");
      socket.off("message");
      socket.off("connected");
      socket.off("authenticated");
      socket.off("ready");
      socket.off("statusOrcamento");
      socket.off("whatsapp-status");
      socket.disconnect();
      socketRef.current = null;
      console.log("Socket.IO desconectado");
    };
  }, []); // Array vazio = executar apenas uma vez na montagem

  // Cálculo automático do orçamento usando dados do backend
  useEffect(() => {
    const { largura, altura, material, acabamento } = form;
    if (largura && altura && material) {
      const area = parseFloat(largura) * parseFloat(altura);
      const mat = materiais.find((m) => m.nome === material);
      const acab = acabamentos.find((a) => a.nome === acabamento);
      let valor = area * (mat?.preco ?? 1);
      if (acab) valor += acab.preco;
      setOrcamento(Number.isFinite(valor) ? valor : null);
    } else {
      setOrcamento(null);
    }
  }, [form, materiais, acabamentos]);

  // Manipulação do formulário
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError(null);
    setStatusEnvio(null);
  }

  function validarCampos() {
    if (!form.largura || !form.altura || !form.material) {
      setFormError("Preencha todos os campos obrigatórios.");
      return false;
    }
    if (isNaN(Number(form.largura)) || isNaN(Number(form.altura))) {
      setFormError("Largura e altura devem ser números válidos.");
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setStatusEnvio(null);
    if (!validarCampos()) return;
    setLoading(true);
    if (socketRef.current) {
      socketRef.current.emit("enviarOrcamento", { ...form, orcamento });
    } else {
      setLoading(false);
      setFormError("Socket não está conectado. Tente novamente.");
    }
  }

  // Função para abrir o modal e verificar o status do WhatsApp
  const openWhatsAppModal = useCallback(() => {
    setShowWhatsModal(true);
    
    // Ao abrir o modal, solicitamos o status atual do WhatsApp
    if (socketRef.current) {
      console.log("Solicitando status atual do WhatsApp ao abrir modal");
      socketRef.current.emit('get-whatsapp-status');
    }
  }, []);

  // Otimizado com useCallback para evitar recriações desnecessárias
  const handleReconnect = useCallback(async (): Promise<void> => {
    try {
      // Definindo estados usando valores diretos, não closures
      setWhatsConnected(false);
      setQr(null);
      setMessage("© BOT-Orçamento - Reconectando WhatsApp...");
      
      console.log("Iniciando processo de reconexão do WhatsApp...");
      
      // Tentamos primeiro via socket, que é mais rápido
      if (socketRef.current) {
        socketRef.current.emit('reconnect-bot');
        return; // Retornamos aqui pois os eventos do socket atualizarão a UI
      }
      
      // Fallback para a API REST se o socket não estiver disponível
      const response = await fetch("/api/reconnect-bot", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Falha na requisição de reconexão:", errorText);
        setMessage(`© BOT-Orçamento - Falha na reconexão: ${response.statusText}`);
        throw new Error(`Falha na requisição de reconexão: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Solicitação de reconexão enviada com sucesso:", data);
      setMessage("© BOT-Orçamento - Reiniciando. Aguarde o código QR...");
      
    } catch (error) {
      console.error("Erro ao reconectar:", error);
      setMessage(`© BOT-Orçamento - Erro ao tentar reconectar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // Referência para o sidebar para sabermos o estado colapsado
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={setSidebarOpen} 
          onCollapseChange={setSidebarCollapsed}
          onWhatsClick={openWhatsAppModal} // Usar a nova função aqui
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16 lg:ml-0' : 'lg:pl-64'} mx-auto pt-16 lg:pt-0`}>
          <div className={`py-6 bg-background max-w-7xl mx-auto px-4 sm:px-6 ${sidebarCollapsed ? 'lg:px-8' : ''}`}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<ErrorBoundary><OrcamentoPage /></ErrorBoundary>} />
                <Route path="/produtos" element={<ErrorBoundary><ProdutosCrudPage /></ErrorBoundary>} />
                <Route path="/orcamentos" element={<ErrorBoundary><OrcamentosEnviadosPage /></ErrorBoundary>} />
              </Routes>
              {/* Modal WhatsApp */}
              <WhatsModal
                show={showWhatsModal}
                onClose={() => setShowWhatsModal(false)}
                whatsConnected={whatsConnected}
                qr={qr}
                message={message}
                onReconnect={handleReconnect}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
