import { useEffect, useState, useRef } from "react";
import { AnimatedSubscribeButton } from "@/components/magicui/animated-subscribe-button";
import { PropostaComercial } from "@/components/proposta";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ToastContainer, toast } from "react-toastify";

  // (Removido daqui, será definido dentro do componente OrcamentoPage)


// Tipos de materiais e lógica de cálculo
const tiposMateriais = {
  "m2": { campos: ["largura", "altura", "quantidade"] },
  "unidade": { campos: ["quantidade"] },
  "milheiro": { campos: ["quantidade"] },
  "kit": { campos: ["quantidade"] },
};

function calcularOrcamento(material, tipo, preco, largura, altura, quantidade) {
  if (!material || !tipo) return 0;
  
  // Normalizar inputs numéricos
  const precoNum = parseFloat(String(preco).replace(',', '.')) || 0;
  const larguraNum = parseFloat(String(largura).replace(',', '.')) || 0;
  const alturaNum = parseFloat(String(altura).replace(',', '.')) || 0;
  const quantidadeNum = Math.max(1, parseInt(String(quantidade)) || 1);
  
  if (tipo === "m2") {
    const area = larguraNum * alturaNum;
    return area * precoNum * quantidadeNum;
  }
  if (tipo === "unidade") {
    return precoNum * quantidadeNum;
  }
  if (tipo === "milheiro") {
    return precoNum * (quantidadeNum / 1000);
  }
  if (tipo === "kit") {
    return precoNum * quantidadeNum;
  }
  return 0;
}


export function OrcamentoPage() {
  const materialRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loadingEnviar, setLoadingEnviar] = useState(false);

    // Estado para modal de informações extras
  const [showInfoModal, setShowInfoModal] = useState<false | 'pdf'>(false);
  const [info, setInfo] = useState({
    cliente: "",
    validade: "7 dias",
    desconto: "",
    pagamento: "À vista"
  });
  const propostaRef = useRef(null);



  const [contatos, setContatos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [contatosSelecionados, setContatosSelecionados] = useState([]);
  const [buscaContato, setBuscaContato] = useState("");
  const [tipoEnvio, setTipoEnvio] = useState<'mensagem' | 'pdf'>('mensagem'); // Controla o tipo de envio


  const [materiais, setMateriais] = useState([]);
  type ProdutoOrcamento = {
    materialSelecionado: any;
    tipo: string;
    preco: number;
    largura: string;
    altura: string;
    quantidade: number;
    valor: number;
    _buscaMaterial?: string;
    _showDropdown?: boolean;
  };
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([
    { materialSelecionado: null, tipo: '', preco: 0, largura: '', altura: '', quantidade: 1, valor: 0 }
  ]);
  const [mensagem, setMensagem] = useState("");

  // Monta os dados do orçamento para passar para o componente PropostaComercial
  // Calcula desconto (pode ser % ou valor fixo)
  function calcularDesconto(valorTotal: number, desconto: string) {
    if (!desconto) return 0;
    
    // Remove espaços e normaliza vírgulas para pontos
    const descontoLimpo = desconto.trim().replace(',', '.');
    
    if (descontoLimpo.includes('%')) {
      const perc = parseFloat(descontoLimpo.replace('%', ''));
      if (!isNaN(perc) && isFinite(perc)) {
        return valorTotal * (perc / 100);
      }
    } else {
      const val = parseFloat(descontoLimpo);
      if (!isNaN(val) && isFinite(val)) {
        return val;
      }
    }
    return 0;
  }

  const orcamentoData = produtos.map((p, idx) => {
    // Valor unitário real: total dividido pela quantidade (evita divisão por zero)
    const valorUnitario = p.quantidade > 0 ? p.valor / p.quantidade : 0;
    return {
      descricao: p.materialSelecionado ? p.materialSelecionado +
        (p.tipo === 'm2' ? ` (${p.largura}x${p.altura}m${p.quantidade > 1 ? `, ${p.quantidade}x` : ''})` :
          p.tipo === 'milheiro' ? (p.quantidade === 1 ? ' (1 milheiro)' : ` (${p.quantidade} milheiros)`) :
          p.tipo === 'unidade' ? (p.quantidade === 1 ? ' (1 unidade)' : ` (${p.quantidade} unidades)`) :
          p.tipo === 'kit' ? (p.quantidade === 1 ? ' (1 kit)' : ` (${p.quantidade} kits)`) :
          '') : '',
      quantidade: p.quantidade,
      valorUnitario,
      total: p.valor
    };
  });
  const valorBruto = produtos.reduce((acc, p) => acc + p.valor, 0);
  const descontoAplicado = calcularDesconto(valorBruto, info.desconto);
  const valorTotal = Math.max(0, valorBruto - descontoAplicado);

   // Carrega materiais do backend ao montar
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setMateriais(data.materiais || []);
      })
      .catch(() => {
        toast.error('Erro ao carregar materiais do banco!');
      });
  }, []);

  // Atualiza tipo e preco ao selecionar material de cada produto
  useEffect(() => {
    setProdutos(produtos => produtos.map((p, idx) => {
      if (!p.materialSelecionado) return { ...p };
      const mat = materiais.find(m => m.nome === p.materialSelecionado);
      if (!mat) return { ...p };
      // Se o material já tem tipo definido no banco, respeite-o
      let tipoDetectado = mat.tipo || 'unidade';
      // Se não houver tipo no banco, tente inferir pelo nome

      return { ...p, tipo: tipoDetectado, preco: mat.preco };
    }));
  }, [materiais, produtos.map(p => p.materialSelecionado).join()]);

  useEffect(() => {
    setProdutos(produtos => produtos.map(p => ({
      ...p,
      valor: calcularOrcamento(
        p.materialSelecionado,
        p.tipo,
        p.preco,
        p.largura,
        p.altura,
        p.quantidade
      )
    })));
  }, [produtos.map(p => [p.materialSelecionado, p.tipo, p.preco, p.largura, p.altura, p.quantidade].join()).join()]);

  // ...código anterior...

  useEffect(() => {
    // Gera mensagem geral do orçamento com novo formato
    const agora = new Date();
    const dataStr = agora.toLocaleDateString("pt-BR");
    const horaStr = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    function addBusinessDays(date, days) {
      let result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() !== 0 && result.getDay() !== 6) {
          added++;
        }
      }
      return result;
    }

    const prazoProducao = 2;
    const previsaoEntrega = addBusinessDays(agora, prazoProducao);
    const previsaoStr = previsaoEntrega.toLocaleDateString("pt-BR");

    // NOVO FORMATO DE PRODUTO
    const msg = produtos.map((p, idx) => {
      if (!p.materialSelecionado) return '';
      const quantidade = p.quantidade || 1;
      const largura = p.largura ? Number(p.largura).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : '';
      const altura = p.altura ? Number(p.altura).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : '';
      const tam = (largura && altura) ? `tam. ${largura}x${altura}m` : '';
      const valorUnit = p.quantidade > 0 ? p.valor / p.quantidade : 0;
      return [
        `${quantidade} un. ${p.materialSelecionado}`,
        tam,
        `V. Unit.:............................R$ ${valorUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `TOTAL:.............................*R$${p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*`,
        ''
      ].filter(Boolean).join('\n');
    }).filter(Boolean).join('\n\n');

    setMensagem(
      `*ORÇAMENTO*:\n${msg}\n\nValor total: *R$${valorTotal.toLocaleString("pt-BR", {minimumFractionDigits:2})}*\nValidade: 7 dias\nPrazo de produção: ${prazoProducao} dias úteis\nData: ${dataStr}\nHora: ${horaStr}\nPrevisão para entrega: ${previsaoStr}`
    );
  }, [produtos, valorTotal]);

// ...código posterior...

  // Rodapé fixo para mensagem
  const rodape = [
    'CNPJ: 52.548.924/0001-20',
    'JULIO DESIGNER',
    'travessa da vitória, Nº 165',
    'bairro: Montanhês',
    'Cep: 69.921-554',
    'WhatsApp: (68) 99976-0124',
  ];

  const dadosBancarios = [
    'PIX 6899976-0124',
    'BANCO DO BRASIL',
    'AG. 2358-2',
    'CC. 108822-X'
  ];


  // Estado para feedback do botão copiar
  const [copiado, setCopiado] = useState(false);
  function copiar() {
    const mensagemComRodape = `${mensagem}\n\n${rodape.join("\n")}\n\n${dadosBancarios.join("\n")}`;
    navigator.clipboard.writeText(mensagemComRodape);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  async function enviarWhatsApp() {
    // Busca contatos reais do backend
    try {
      const res = await fetch("/api/contatos");
      const lista = await res.json();
      setContatos(lista);
      setTipoEnvio('mensagem'); // Define como envio de mensagem apenas
      setShowModal(true);
    } catch (e) {
      toast.error("Erro ao buscar contatos: " + e);
    }
  }

  // Substituir handleEnviarParaSelecionados para gerar e enviar PDF
  async function enviarMensagemWhatsApp() {
    if (contatosSelecionados.length === 0) return;
    setLoadingEnviar(true);
    try {
      const resp = await fetch('/api/enviarMensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeros: contatosSelecionados,
          mensagem,
          cliente_nome: info.cliente || 'Cliente',
          produtos: orcamentoData,
          valor_total: valorTotal
        })
      });
      let data = null;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        toast.error("Erro ao processar resposta do servidor. Tente novamente.");
        setShowModal(false);
        return;
      }
      if (data && data.ok) {
        toast.success("Mensagem enviada para os contatos selecionados!");
      } else {
        toast.error("Falha ao enviar mensagem: " + (data?.error || "Erro desconhecido"));
      }
    } catch (e) {
      toast.error("Erro ao enviar: " + e);
    }
    setShowModal(false);
    setLoadingEnviar(false);
  }

  async function enviarPDFWhatsApp() {
    if (contatosSelecionados.length === 0) return;
    if (!propostaRef.current) return toast.error('Erro ao gerar PDF tente novamente');
    setLoadingEnviar(true);
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const html2canvas = (await import('html2canvas')).default;
      
      const node = propostaRef.current;
      const prevBorder = node.style.border;
      const prevBoxShadow = node.style.boxShadow;
      node.style.border = 'none';
      node.style.boxShadow = 'none';
      node.style.outline = 'none';
      
      // Configurações otimizadas para performance
      const canvas = await html2canvas(node, {
        backgroundColor: '#fff',
        scale: 1.5, // Reduzido para melhor performance
        useCORS: true,
        logging: false,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });
      
      node.style.border = prevBorder;
      node.style.boxShadow = prevBoxShadow;
      
      // Converter com compressão JPEG
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Criar PDF otimizado
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `Orcamento-${info.cliente || 'Cliente'}.pdf`);
      formData.append('numeros', JSON.stringify(contatosSelecionados));
      formData.append('cliente_nome', info.cliente || 'Cliente');
      formData.append('produtos', JSON.stringify(orcamentoData));
      formData.append('valor_total', valorTotal.toString());
      
      const resp = await fetch('/api/enviarPDF', {
        method: 'POST',
        body: formData
      });
      
      let data = null;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        toast.error("Erro ao processar resposta do servidor. Tente novamente.");
        setShowModal(false);
        return;
      }
      
      if (data && data.ok) {
        toast.success("PDF enviado para os contatos selecionados!");
      } else {
        toast.error("Falha ao enviar PDF: " + (data?.error || "Erro desconhecido"));
      }
    } catch (e) {
      toast.error("Erro ao enviar PDF: " + e);
    }
    setShowModal(false);
    setLoadingEnviar(false);
  }
  function handleCheckContato(numero) {
    setContatosSelecionados(prev =>
      prev.includes(numero)
        ? prev.filter(n => n !== numero)
        : [...prev, numero]
    );
  }



  return (
    <>
      <ToastContainer 
        position="top-center" 
        autoClose={3500} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover
        theme="auto"
        className="relative"
      />
      <div className="max-w-3xl mx-auto bg-card rounded-xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-10 border border-border">
        <h2 className="text-3xl font-extrabold mb-8 text-foreground tracking-tight text-center">Novo Orçamento</h2>
        {produtos.map((p, idx) => (
          <div key={p.materialSelecionado ? p.materialSelecionado + '-' + idx : idx} className="mb-2 border-b pb-2 last:border-b-0 last:pb-0">
            <div
              className="grid grid-cols-1 md:grid-cols-[minmax(180px,1.7fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(80px,0.8fr)_minmax(110px,1fr)_minmax(60px,0.5fr)] gap-x-2 gap-y-2 items-end"
            >
              <div className="flex flex-col">
                <label className="block mb-0.5 font-semibold text-md text-foreground">Produtos  </label>
                <div className="relative min-w-[10px]">
                  <input
                    ref={el => { materialRefs.current[idx] = el; }}
                    type="text"
                    className="border border-border rounded px-2 py-1 w-full min-w-[160px] max-w-[200px] focus:ring-2 focus:ring-ring focus:border-ring transition outline-none shadow-sm text-sm bg-card text-foreground"
                    placeholder="Buscar Produto..."
                    value={p._buscaMaterial || ''}
                    onChange={e => {
                      const busca = e.target.value;
                      setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, _buscaMaterial: busca } : prod));
                    }}
                    onFocus={e => {
                      if (!p._showDropdown) {
                        setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, _showDropdown: true } : { ...prod, _showDropdown: false }));
                      }
                    }}
                    onBlur={e => {
                      setTimeout(() => {
                        setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, _showDropdown: false } : prod));
                      }, 150);
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    tabIndex={-1}
                    onClick={() => setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, _showDropdown: !prod._showDropdown } : { ...prod, _showDropdown: false }))}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {p._showDropdown && (
                    <div className="absolute z-20 left-0 right-0 bg-card border border-t-0 rounded-b shadow max-h-56 overflow-y-auto animate-fade-in">
                      {materiais.filter(mat => {
                        const busca = (p._buscaMaterial || '').toLowerCase();
                        return !busca || mat.nome.toLowerCase().includes(busca);
                      }).length === 0 ? (
                        <div className="px-3 py-2 text-muted-foreground text-sm">Nenhum Produto encontrado</div>
                      ) : materiais.filter(mat => {
                        const busca = (p._buscaMaterial || '').toLowerCase();
                        return !busca || mat.nome.toLowerCase().includes(busca);
                      }).map(mat => (
                        <button
                          type="button"
                          key={mat.nome}
                          className={`w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-foreground ${p.materialSelecionado === mat.nome ? 'bg-accent font-semibold' : ''}`}
                          onClick={() => {
                            setProdutos(produtos => produtos.map((prod, i) => i === idx ? {
                              ...prod,
                              materialSelecionado: mat.nome,
                              preco: mat.preco,
                              tipo: prod.tipo, // será atualizado pelo useEffect
                              largura: '',
                              altura: '',
                              quantidade: 1,
                              _buscaMaterial: mat.nome,
                              _showDropdown: false
                            } : prod));
                          }}
                        >
                          <span className="truncate max-w-[240px]" title={mat.nome}>{mat.nome}</span>
                          {mat.preco ? <span className="ml-auto text-xs text-green-600 font-bold">R$ {Number(mat.preco).toLocaleString("pt-BR", {minimumFractionDigits:2})}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
               
              </div>
              {p.tipo && tiposMateriais[p.tipo]?.campos.includes("largura") ? (
                <div className="flex flex-col min-w-0">
                  <label className="block mb-0.5 text-xs text-muted-foreground">Largura (m)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="border rounded px-2 py-1 min-w-[80px] max-w-[120px] text-sm bg-card text-foreground border-border"
                    value={p.largura}
                    onChange={e => setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, largura: e.target.value } : prod))}
                  />
                </div>
              ) : <div />}
              {p.tipo && tiposMateriais[p.tipo]?.campos.includes("altura") ? (
                <div className="flex flex-col min-w-0">
                  <label className="block mb-0.5 text-xs text-muted-foreground">Altura (m)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="border rounded px-2 py-1 min-w-[80px] max-w-[120px] text-sm bg-card text-foreground border-border"
                    value={p.altura}
                    onChange={e => setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, altura: e.target.value } : prod))}
                  />
                </div>
              ) : <div />}
              {p.tipo && tiposMateriais[p.tipo]?.campos.includes("quantidade") ? (
                <div className="flex flex-col min-w-0">
                  <label className="block mb-0.5 text-xs text-muted-foreground">Qtd</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="border rounded px-2 py-1 min-w-[60px] max-w-[80px] text-sm bg-card text-foreground border-border"
                    value={p.quantidade}
                    onChange={e => setProdutos(produtos => produtos.map((prod, i) => i === idx ? { ...prod, quantidade: Number(e.target.value) } : prod))}
                  />
                </div>
              ) : <div />}
              <div className="flex flex-row ml-auto min-w-0 align-middle items-end justify-end h-full">
                <div className="flex flex-col">
                    <label className="block mb-0.5 text-xs text-muted-foreground">Subtotal</label>
                  <span className="text-green-600 font-extrabold text-xl whitespace-nowrap">R${p.valor.toLocaleString("pt-BR", {minimumFractionDigits:2})}</span>
                </div>
                {produtos.length > 1 && (
                  <button
                    type="button"
                    className="text-red-600 text-lg px-2 py-1 mt-1 hover:bg-red-100 rounded-full flex items-center justify-center"
                    title="Remover produto"
                    onClick={() => setProdutos(produtos => produtos.filter((_, i) => i !== idx))}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="mb-4 px-4 py-2 rounded bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md w-full sm:w-auto"
          onClick={() => {
            setProdutos(produtos => {
              const novos = [...produtos, { materialSelecionado: null, tipo: '', preco: 0, largura: '', altura: '', quantidade: 1, valor: 0, _showDropdown: true }];
              setTimeout(() => {
                if (materialRefs.current[novos.length - 1]) {
                  materialRefs.current[novos.length - 1].focus();
                }
              }, 50);
              return novos.map((prod, i) => i === novos.length - 1 ? { ...prod, _showDropdown: true } : { ...prod, _showDropdown: false });
            });
          }}
        >
          + Adicionar produto
        </button>
        <div className="mb-4 mt-4">
          <span className="font-semibold text-foreground">Valor total: </span>
          <span className="text-lg text-green-600 font-bold">R${valorTotal.toLocaleString("pt-BR", {minimumFractionDigits:2})}</span>
        </div>
        <div className="mb-4">
          <textarea
            className="border rounded px-2 py-1 w-full text-sm bg-card text-foreground border-border"
            rows={4}
            value={mensagem}
            readOnly
          />
        </div>
        <div className="flex gap-2">
          <AnimatedSubscribeButton
            subscribeStatus={copiado}
            onClick={copiar}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded font-semibold"
          >
            <span>Copiar orçamento</span>
            <span>Mensagem copiada!</span>
          </AnimatedSubscribeButton>
          <button
            className="bg-green-600 hover:bg-green-700 text-primary-foreground px-4 py-2 rounded font-semibold"
            type="button"
            onClick={enviarWhatsApp}
          >
            Enviar para WhatsApp
          </button>
          <button
            className="bg-primary hover:bg-primary/90 text-secondary-foreground px-4 py-2 rounded font-semibold"
            type="button"
            onClick={() => {
              // Buscar contatos e abrir modal para PDF
              setTipoEnvio('pdf');
              setShowInfoModal('pdf');
            }}
          >
            Enviar PDF
          </button>
        </div>
        {/* Modal de informações extras */}
        {showInfoModal === 'pdf' && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-card rounded shadow-lg p-8 max-w-md w-full relative border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">Informações extras</h3>
              <div className="flex flex-col gap-3">
                <label className="text-foreground">
                  Cliente:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="cliente"
                    value={info.cliente}
                    onChange={e => setInfo({ ...info, cliente: e.target.value })}
                  />
                </label>
                <label className="text-foreground">
                  Validade da proposta:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="validade"
                    value={info.validade}
                    onChange={e => setInfo({ ...info, validade: e.target.value })}
                  />
                </label>
                <label className="text-foreground">
                  Entrada:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="desconto"
                    value={info.desconto}
                    onChange={e => setInfo({ ...info, desconto: e.target.value })}
                  />
                </label>
                <label className="text-foreground">
                  Forma de pagamento:
                  <input
                    className="border rounded px-2 py-1 w-full mt-1 bg-card text-foreground border-border"
                    name="pagamento"
                    value={info.pagamento}
                    onChange={e => setInfo({ ...info, pagamento: e.target.value })}
                  />
                </label>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  className="px-4 py-2 rounded bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  onClick={() => setShowInfoModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                  onClick={async () => {
                    setShowInfoModal(false);
                    // Abrir modal de contatos baseado no tipo de envio
                    try {
                      const res = await fetch("/api/contatos");
                      const lista = await res.json();
                      setContatos(lista);
                      setShowModal(true);
                    } catch (e) {
                      toast.error("Erro ao buscar contatos: " + e);
                    }
                  }}
                >
                  {tipoEnvio === 'pdf' ? 'Enviar PDF' : 'Enviar WhatsApp'}
                </button>
                <button
                  className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800"
                  onClick={async () => {
                    if (!propostaRef.current) return toast.error('Erro ao gerar PDF: componente não encontrado');
                    const node = propostaRef.current;
                    const prevBorder = node.style.border;
                    const prevBoxShadow = node.style.boxShadow;
                    node.style.border = 'none';
                    node.style.boxShadow = 'none';
                    node.style.outline = 'none';
                    try {
                      // Configurações otimizadas para performance e tamanho
                      const canvas = await html2canvas(node, {
                        backgroundColor: '#fff',
                        scale: 1.5, // Reduzido para melhor performance
                        useCORS: true,
                        logging: false,
                        width: node.scrollWidth,
                        height: node.scrollHeight,
                      });
                      
                      // Converter com compressão JPEG para reduzir tamanho
                      const imgData = canvas.toDataURL('image/jpeg', 0.8); // 80% de qualidade
                      
                      // Criar PDF otimizado
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      const imgWidth = 210; // A4 width in mm
                      const pageHeight = 297; // A4 height in mm
                      const imgHeight = (canvas.height * imgWidth) / canvas.width;
                      let heightLeft = imgHeight;
                      let position = 0;

                      // Adicionar primeira página
                      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                      heightLeft -= pageHeight;

                      // Adicionar páginas adicionais se necessário
                      while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                      }

                      pdf.save(`Orcamento-${info.cliente || 'Cliente'}.pdf`);
                      toast.success('PDF baixado com sucesso!');
                    } catch (e) {
                      toast.error('Erro ao baixar PDF: ' + e);
                    } finally {
                      node.style.border = prevBorder;
                      node.style.boxShadow = prevBoxShadow;
                    }
                    // NÃO fechar o modal após baixar PDF - modal permanece aberto
                  }}
                >
                  Baixar PDF
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Renderização invisível do PropostaComercial para gerar PDF */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, border: 'none', boxShadow: 'none', outline: 'none' }}>
          <div ref={propostaRef} className=" rounded-none shadow-none border-none isolate">
            <PropostaComercial
              cliente={info.cliente || 'Cliente'}
              validade={info.validade || '7 dias'}
              desconto={Number(info.desconto)}
              pagamento={info.pagamento || 'À vista'}
              orcamento={orcamentoData}
              total={valorTotal}
            />
          </div>
        </div>

      
      </div>
      {/* Modal de seleção de contatos */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card rounded shadow-lg p-8 max-w-md w-full relative border border-border">
            <h3 className="text-xl font-bold mb-4 text-foreground">Selecione os contatos para envio</h3>
            <input
              className="border rounded px-2 py-1 w-full mb-4 bg-card text-foreground border-border"
              placeholder="Buscar por nome ou telefone..."
              value={buscaContato}
              onChange={e => setBuscaContato(e.target.value)}
              autoFocus
            />
            <div className="flex flex-col gap-2 mb-4 max-h-60 overflow-y-auto">
              {contatos.length === 0 ? (
                <span className="text-muted-foreground">Nenhum contato encontrado.</span>
              ) : contatos
                .filter(contato => {
                  const nome = (contato.nome || "").normalize("NFD").replace(/[^\w\s.-]/g, "").toLowerCase();
                  const busca = (buscaContato || "").normalize("NFD").replace(/[^\w\s.-]/g, "").toLowerCase();
                  const numero = (contato.numero || "");
                  const buscaNum = buscaContato.replace(/\D/g, "");
                  return (
                    nome.includes(busca) ||
                    (buscaNum && numero.includes(buscaNum))
                  );
                })
                .map(contato => (
                  <label key={contato.numero} className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input
                      type="checkbox"
                      checked={contatosSelecionados.includes(contato.numero)}
                      onChange={() => handleCheckContato(contato.numero)}
                    />
                    <span>{contato.nome} <span className="text-xs text-muted-foreground">({contato.numero})</span></span>
                  </label>
                ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => {
                  setShowModal(false);
                  setContatosSelecionados([]);
                }}
              >
                Cancelar
              </button>
              {tipoEnvio === 'mensagem' && (
                <button
                  className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center gap-2"
                  disabled={contatosSelecionados.length === 0 || loadingEnviar}
                  onClick={enviarMensagemWhatsApp}
                >
                  {loadingEnviar && (
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loadingEnviar ? "Enviando..." : "Enviar"}
                </button>
              )}
              {tipoEnvio === 'pdf' && (
                <button
                  className="px-4 py-2 rounded bg-gray-800 text-white font-semibold hover:bg-gray-900 flex items-center gap-2"
                  disabled={contatosSelecionados.length === 0 || loadingEnviar}
                  onClick={enviarPDFWhatsApp}
                >
                  {loadingEnviar && (
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {loadingEnviar ? "Enviando..." : "Enviar PDF"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

}