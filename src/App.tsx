import { useEffect, useState, useCallback, useRef } from "react";
import { OrcamentoPage } from "./page/orcamentos/";
import { ProdutosCrudPage } from "./page/produtos";
import { OrcamentosEnviadosPage } from "./page/enviados";
import check from "./check.svg";
import { io, Socket } from "socket.io-client";
import { Routes, Route } from "react-router-dom";

import { WhatsModal } from "./components/WhatsModal";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Tipos para o Socket
interface ServerToClientEvents {
  qr: (data: string) => void;
  message: (msg: string) => void;
  connected: () => void;
  authenticated: (msg: string) => void;
  ready: (msg: string) => void;
  statusOrcamento: (data: { status: string; mensagem: string }) => void;
}

interface ClientToServerEvents {
  clientReady: () => void;
  enviarOrcamento: (data: any) => void;
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
      
      // Se o QR não for o check.svg, então o WhatsApp não está conectado
      if (data !== check && !data.includes('check.svg')) {
        setWhatsConnected(false);
      } else {
        setWhatsConnected(true);
      }
    });
    
    socket.on("message", (msg: string) => {
      console.log("Mensagem recebida:", msg);
      setMessage(msg);
    });
    
    socket.on("connected", () => {
      console.log("WhatsApp conectado (evento connected)");
      setWhatsConnected(true);
      setQr(check);
      setMessage("© BOT-Orçamento - Dispositivo conectado!");
    });
    
    socket.on("authenticated", (msg: string) => {
      console.log("WhatsApp autenticado:", msg);
      // Não definimos whatsConnected como true aqui, apenas no ready
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
    
    // Verificar status inicial do bot
    fetch("/api/bot-status")
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setWhatsConnected(true);
          setQr(check);
          setMessage("© BOT-Orçamento - Dispositivo conectado!");
        }
      })
      .catch(err => console.error("Erro ao verificar status do bot:", err));
    
    // Avisa o servidor que o cliente está pronto
    socket.emit("clientReady");
    
    console.log("Socket.IO conectado");
    
    // Cleanup function para remover event listeners e desconectar socket
    return () => {
      socket.off("qr");
      socket.off("message");
      socket.off("connected");
      socket.off("authenticated");
      socket.off("ready");
      socket.off("statusOrcamento");
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

  // Otimizado com useCallback para evitar recriações desnecessárias
  const handleReconnect = useCallback(async (): Promise<void> => {
    try {
      // Definindo estados usando valores diretos, não closures
      setWhatsConnected(false);
      setQr(null);
      setMessage("© BOT-Orçamento - Reconectando WhatsApp...");
      
      console.log("Iniciando processo de reconexão do WhatsApp...");
      
      // Fazemos a solicitação para reconectar o bot
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
      
      // Não precisamos fazer mais nada aqui, os eventos do socket
      // irão atualizar os estados da interface automaticamente
    } catch (error) {
      console.error("Erro ao reconectar:", error);
      setMessage(`© BOT-Orçamento - Erro ao tentar reconectar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []); // Sem dependências para evitar recriações

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="lg:pl-64 transition-all duration-300">
        <Navbar 
          onWhatsClick={() => setShowWhatsModal(true)} 
          onSidebarToggle={() => setSidebarOpen(true)}
        />
        <div className="pt-20 bg-background">
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
  );
}
