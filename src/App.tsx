import { useEffect, useState, useCallback, useRef } from "react";
import { OrcamentoPage } from "./page/orcamentos/";
import { ProdutosCrudPage } from "./page/produtos";
import { OrcamentosEnviadosPage } from "./page/enviados";
import check from "./check.svg";

import { Routes, Route } from "react-router-dom";

import { WhatsModal } from "./components/WhatsModal";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { ErrorBoundary } from "./components/ErrorBoundary";


export function App() {
  // Refs para prevenir atualizações desnecessárias
  const socketRef = useRef<any>(null);
  
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
      });
  }, []);

  // Conexão com socket.io - usando uma abordagem mais estável com useEffect
  useEffect(() => {
    // Usando require fora do corpo da função para evitar imports dinâmicos
    const io = require("socket.io-client");
    
    // Criamos a instância do socket apenas uma vez e armazenamos na ref
    const socket = io("http://localhost:3001");
    socketRef.current = socket;
    
    // Configurando os event listeners
    socket.on("qr", (data: string) => {
      setQr(data);
    });
    
    socket.on("message", (msg: string) => {
      setMessage(msg);
    });
    
    socket.on("connected", () => {
      setWhatsConnected(true);
      setQr(check);
      setMessage("WhatsApp conectado com sucesso!");
    });
    
    socket.on("statusOrcamento", (res: any) => {
      setStatusEnvio(res.status === "enviado" ? "Orçamento enviado com sucesso!" : "Falha ao enviar orçamento.");
      setLoading(false);
    });
    
    // Avisa o servidor que o cliente está pronto
    socket.emit("clientReady");
    
    // Cleanup function para remover event listeners e desconectar socket
    return () => {
      socket.off("qr");
      socket.off("message");
      socket.off("connected");
      socket.off("statusOrcamento");
      socket.disconnect();
      socketRef.current = null;
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
  const handleReconnect = useCallback(async () => {
    // Definindo estados usando valores diretos, não closures
    setWhatsConnected(false);
    setQr(null);
    setMessage("Reconectando WhatsApp...");
    
    try {
      const response = await fetch("/api/reconnect-bot", { method: "POST" });
      
      if (!response.ok) {
        throw new Error("Falha na requisição de reconexão");
      }
      
      // Usamos um setTimeout para verificar o status depois
      // mas não dependemos dos valores de estado no momento da criação da callback
      setTimeout(async () => {
        try {
          const statusResponse = await fetch("/api/bot-status");
          
          // Verifica se a resposta foi bem-sucedida antes de tentar fazer o parse do JSON
          if (!statusResponse.ok) {
            throw new Error(`API respondeu com status ${statusResponse.status}`);
          }
          
          // Verifica o tipo de conteúdo da resposta
          const contentType = statusResponse.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Resposta não é JSON: ${contentType}`);
          }
          
          const status = await statusResponse.json();
          
          // Aqui não usamos os valores de closure, mas sim os novos dados da API
          if (!status.connected) {
            setMessage("Falha ao reconectar. Tente novamente.");
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
          setMessage("Erro ao verificar status. Tente novamente.");
        }
      }, 10000);
    } catch (error) {
      console.error("Erro ao reconectar:", error);
      setMessage("Erro ao tentar reconectar. Tente novamente.");
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
