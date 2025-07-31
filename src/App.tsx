import { useEffect, useState } from "react";
import { OrcamentoPage } from "./page/OrcamentoPage";
import { ProdutosCrudPage } from "./page/ProdutosCrudPage";
import check from "./check.svg";

import { Routes, Route } from "react-router-dom";

import { WhatsModal } from "./components/WhatsModal";
import { Navbar } from "./components/Navbar";


export function App() {
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
  const [socketInstance, setSocketInstance] = useState<any>(null);
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

  // Conexão com socket.io
  useEffect(() => {
    import("socket.io-client").then((io) => {
      const socket = io.default("http://localhost:3001");
      setSocketInstance(socket);
      socket.on("qr", (data: string) => setQr(data));
      socket.on("message", (msg: string) => setMessage(msg));
      socket.on("connected", () => {
        setWhatsConnected(true);
        setQr(check); // Troca o QRCode pelo check.svg
        setMessage("WhatsApp conectado com sucesso!");
      });
      socket.on("statusOrcamento", (res: any) => {
        setStatusEnvio(res.status === "enviado" ? "Orçamento enviado com sucesso!" : "Falha ao enviar orçamento.");
        setLoading(false);
      });
      return () => socket.disconnect();
    });
  }, []);

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
    if (socketInstance) {
      socketInstance.emit("enviarOrcamento", { ...form, orcamento });
    }
  }

  const handleReconnect = async () => {
    setWhatsConnected(false);
    setQr(null);
    setMessage("Reconectando WhatsApp...");
    await fetch("/api/reconnect-bot", { method: "POST" });
    setTimeout(() => {
      setMessage((msg) => {
        if (!whatsConnected && !qr) {
          return "Falha ao reconectar. Tente novamente.";
        }
        return msg;
      });
    }, 10000);
  }

  return (
    <div className="min-h-screen">
      <Navbar onWhatsClick={() => setShowWhatsModal(true)} />
      <div className="pt-20">
        <Routes>
          <Route path="/" element={
            <main className="flex flex-col min-h-screen">
              <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-5rem)]">
                <section className="w-full max-w-6xl mx-auto flex items-center justify-center">
                  <OrcamentoPage />
                </section>
              </div>
            </main>
          } />
          <Route path="/produtos" element={<ProdutosCrudPage />} />
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
      </div>
    </div>
  );
}
