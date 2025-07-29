
import { Card, CardContent } from "./components/ui/card";
import { useEffect, useState } from "react";
import { OrcamentoPage } from "./page/OrcamentoPage";
import { ProdutosCrudPage } from "./page/ProdutosCrudPage";

import check from "./check.svg";
import Logo from './logo-julio.png';


import { bot } from '../src/bot';


export function App() {
  const [page, setPage] = useState<string>("dashboard");
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

  return (
    <div className="min-h-screen">

      <header className="fixed bg-white left-0 top-0 right-0 h-20 flex items-center px-8 z-20 shadow justify-between">
        <div className="flex items-center gap-4">
          <img src={Logo} alt="Logo" className="h-12 " />
          <span className="text-2xl font-bold">Dashboard de Orçamentos</span>
        </div>
        <nav className="flex gap-6 items-center">
          <button className={`font-semibold ${page === "dashboard" ? "text-green-700" : "text-gray-700"}`} onClick={() => setPage("dashboard")}>Orçamentos</button>
          <button className={`font-semibold ${page === "produtos" ? "text-green-700" : "text-gray-700"}`} onClick={() => setPage("produtos")}>Produtos</button>
          <button
            className="ml-4 px-3 py-1 rounded bg-green-600 text-white font-semibold hover:bg-green-700 border border-green-700"
            onClick={() => setShowWhatsModal(true)}
            title="Status do WhatsApp"
          >
            WhatsApp
          </button>
        </nav>
      </header>
      <div className="pt-20">
        {page === "produtos" ? (
          <ProdutosCrudPage />
        ) : (
          <main className="flex flex-col min-h-screen">
            <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-5rem)]">
              <section className="w-full max-w-6xl mx-auto flex items-center justify-center">
                <OrcamentoPage />
              </section>
            </div>
          </main>
        )}
        {/* Modal WhatsApp */}
        {showWhatsModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-8 max-w-md w-full relative flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                onClick={() => setShowWhatsModal(false)}
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
                onClick={async () => {
                  setWhatsConnected(false);
                  setQr(null);
                  setMessage("Reconectando WhatsApp...");
                  // Aguarda reconexão e exibe skeleton até receber novo QR ou conexão
                  await fetch("/api/reconnect-bot", { method: "POST" });
                  // Se em 10s não receber QR ou conexão, mostra erro
                  setTimeout(() => {
                    setMessage((msg) => {
                      if (!whatsConnected && !qr) {
                        return "Falha ao reconectar. Tente novamente.";
                      }
                      return msg;
                    });
                  }, 10000);
                }}
                title="Reconectar WhatsApp"
              >
                Reconectar WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

  );
}
