
import { Card, CardContent } from "./components/ui/card";
import { useEffect, useState } from "react";
import { OrcamentoPage } from "./page/OrcamentoPage";
import { ProdutosCrudPage } from "./page/ProdutosCrudPage";

import check from "./check.svg";
import Logo from './logo-julio.png';
import { PropostaComercial } from "./components/proposta";



export function App() {
  const [page, setPage] = useState<string>("dashboard");
  // Estado para QRCode e mensagens do backend
  const [qr, setQr] = useState<string | null>(null);
  const [whatsConnected, setWhatsConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
        <nav className="flex gap-6">
          <button className={`font-semibold ${page === "dashboard" ? "text-green-700" : "text-gray-700"}`} onClick={() => setPage("dashboard")}>Orçamentos</button>
          <button className={`font-semibold ${page === "produtos" ? "text-green-700" : "text-gray-700"}`} onClick={() => setPage("produtos")}>Produtos</button>
        </nav>
      </header>
      <div className="pt-20">
          {page === "produtos" ? (
            <ProdutosCrudPage />
          ) : (
            <main className="flex flex-col min-h-screen">
              <div className="flex flex-col md:flex-row gap-8 p-8 flex-1" id="dashboard-content">
                <section className="flex-1" id="qrcode">
                  <Card className="max-w-md mx-auto mb-8 shadow-lg">
                    <CardContent className="flex flex-col items-center py-6">
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
                      {message && <p className="mt-4 text-lg font-semibold">{message}</p>}
                    </CardContent>
                  </Card>
                </section>
                <section className="flex-1" id="orcamento">
                  <OrcamentoPage />
                </section>
              </div>
            </main>
          )}
        </div>
    </div>

  );
}
