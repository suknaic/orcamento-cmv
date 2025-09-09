import React from "react";
import { useEnviadosContext } from "../contexts/EnviadosContext";
import { PropostaComercial } from "@/components/proposta";

export function InfoModal() {
  const {
    showInfoModal,
    setShowInfoModal,
    orcamentoSelecionado,
    info,
    setInfo,
    enviarPDFDireto,
    loadingReenvio,
    propostaRef
  } = useEnviadosContext();

  // Função para calcular desconto
  const calcularDesconto = (valorTotal: number, desconto: string) => {
    if (!desconto) return 0;
    const descontoLimpo = desconto.trim().replace(",", ".");
    if (descontoLimpo.includes("%")) {
      const perc = parseFloat(descontoLimpo.replace("%", ""));
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
  };

  if (showInfoModal !== 'pdf' || !orcamentoSelecionado) {
    return null;
  }

  const downloadPDF = async () => {
    if (!propostaRef.current || !orcamentoSelecionado) return;
    
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    
    const node = propostaRef.current;
    const prevBorder = (node as HTMLElement).style.border;
    const prevBoxShadow = (node as HTMLElement).style.boxShadow;
    (node as HTMLElement).style.border = 'none';
    (node as HTMLElement).style.boxShadow = 'none';
    (node as HTMLElement).style.outline = 'none';
    
    try {
      // Aguardar carregamento de imagens
      const images = node.querySelectorAll('img');
      await Promise.all(Array.from(images).filter(img => !img.complete).map(img => {
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
      
      const canvas = await html2canvas(node, {
        backgroundColor: '#fff',
        scale: 1.5,
        useCORS: true,
        logging: false,
        width: (node as HTMLElement).scrollWidth,
        height: (node as HTMLElement).scrollHeight,
        allowTaint: true,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
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

      pdf.save(`Orcamento-${orcamentoSelecionado.cliente_nome}-${orcamentoSelecionado.id}.pdf`);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
    } finally {
      (node as HTMLElement).style.border = prevBorder;
      (node as HTMLElement).style.boxShadow = prevBoxShadow;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl shadow-2xl max-w-md w-full relative border border-border max-h-[90vh] overflow-y-auto">
          {/* Header do Modal */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Informações da Proposta</h3>
                <p className="text-primary-foreground/90 text-sm">
                  Para: <span className="font-semibold">{orcamentoSelecionado.cliente_nome.toUpperCase()}</span>
                </p>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Nome do Cliente:
                  </div>
                </label>
                <input
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={info.cliente}
                  onChange={e => setInfo({ ...info, cliente: e.target.value })}
                  placeholder="Digite o nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-6 0h6" />
                    </svg>
                    Validade da Proposta:
                  </div>
                </label>
                <input
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={info.validade}
                  onChange={e => setInfo({ ...info, validade: e.target.value })}
                  placeholder="Ex: 7 dias, 30 dias"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Valor da Entrada:
                  </div>
                </label>
                <input
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={info.desconto}
                  onChange={e => setInfo({ ...info, desconto: e.target.value })}
                  placeholder="Ex: R$ 1.000,00 ou 10%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Forma de Pagamento:
                  </div>
                </label>
                <input
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={info.pagamento}
                  onChange={e => setInfo({ ...info, pagamento: e.target.value })}
                  placeholder="Ex: À vista, Parcelado, PIX"
                />
              </div>
            </div>

            {/* Resumo do orçamento */}
            <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Resumo do Orçamento
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Orçamento ID:</span>
                  <span className="font-mono">#{orcamentoSelecionado.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produtos:</span>
                  <span>{orcamentoSelecionado.produtos.length} item{orcamentoSelecionado.produtos.length !== 1 ? 'ns' : ''}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground pt-2 border-t border-border">
                  <span>Total:</span>
                  <span className="text-green-600 dark:text-green-400">
                    R$ {orcamentoSelecionado.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium transition-colors"
                onClick={() => setShowInfoModal(false)}
              >
                Cancelar
              </button>
              
              <button
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
                onClick={enviarPDFDireto}
                disabled={loadingReenvio}
              >
                {loadingReenvio ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {loadingReenvio ? 'Enviando...' : 'Enviar PDF via WhatsApp'}
              </button>
              
              <button
                className="px-4 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                onClick={downloadPDF}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Renderização invisível do PropostaComercial para gerar PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, border: 'none', boxShadow: 'none', outline: 'none' }}>
        <div ref={propostaRef} className="rounded-none shadow-none border-none isolate">
          <PropostaComercial
            cliente={info.cliente || orcamentoSelecionado.cliente_nome}
            validade={info.validade || '7 dias'}
            desconto={calcularDesconto(orcamentoSelecionado.valor_total, info.desconto)}
            pagamento={info.pagamento || 'À vista'}
            orcamento={orcamentoSelecionado.produtos}
            total={orcamentoSelecionado.valor_total}
          />
        </div>
      </div>
    </>
  );
}
