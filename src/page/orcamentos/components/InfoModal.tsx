import React from 'react';
import { useOrcamentoContext } from '../contexts/OrcamentoContext';
import { Modal } from '@/components/ui/modal';
import { CancelButton, SendButton, Button } from '@/components/ui/button-variants';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function InfoModal() {
  const {
    showInfoModal,
    setShowInfoModal,
    info,
    setInfo,
    valorTotal,
    produtos,
    orcamentoData,
    contatos,
    setContatos,
    setShowModal,
    loadingEnviar,
    propostaRef
  } = useOrcamentoContext();

  if (!showInfoModal) return null;

  return (
    <Modal
      isOpen={showInfoModal === "pdf"}
      onClose={() => setShowInfoModal(false)}
      title="Finalizar Orçamento"
      subtitle="Complete as informações para gerar o orçamento"
      variant="default"
      size="lg"
      footer={
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
          <CancelButton onClick={() => setShowInfoModal(false)} />
          <SendButton
            onClick={async () => {
              setShowInfoModal(false);
              try {
                const res = await fetch("/api/contatos");
                const lista = await res.json();
                setContatos(lista);
                setShowModal(true);
              } catch (e) {
                toast.error("Erro ao buscar contatos: " + e);
              }
            }}
            loading={loadingEnviar}
          >
            Continuar para Envio PDF
          </SendButton>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!propostaRef.current)
                return toast.error("Erro ao gerar PDF: componente não encontrado");
              
              const node = propostaRef.current;
              const prevBorder = node.style.border;
              const prevBoxShadow = node.style.boxShadow;
              node.style.border = "none";
              node.style.boxShadow = "none";
              node.style.outline = "none";
              
              try {
                const canvas = await html2canvas(node, {
                  backgroundColor: "#fff",
                  scale: 1.5,
                  useCORS: true,
                  logging: false,
                  width: node.scrollWidth,
                  height: node.scrollHeight,
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.8);
                const pdf = new jsPDF("p", "mm", "a4");
                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
                }

                pdf.save(`Orcamento_${info.cliente || "Cliente"}.pdf`);

                node.style.border = prevBorder;
                node.style.boxShadow = prevBoxShadow;

                toast.success("PDF salvo com sucesso!");
              } catch (error) {
                node.style.border = prevBorder;
                node.style.boxShadow = prevBoxShadow;
                console.error("Erro ao gerar PDF:", error);
                toast.error("Erro ao gerar PDF: " + error);
              }
            }}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Baixar PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Nome do Cliente
              </div>
            </label>
            <input
              className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              name="cliente"
              value={info.cliente}
              placeholder="Ex: João Silva"
              onChange={(e) => setInfo({ ...info, cliente: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-5 8a1 1 0 100-2 1 1 0 000 2zm5-8H9a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 00-1-1z" />
                  </svg>
                  Validade
                </div>
              </label>
              <input
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                name="validade"
                value={info.validade}
                placeholder="Ex: 7 dias"
                onChange={(e) => setInfo({ ...info, validade: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Entrada/Desconto
                </div>
              </label>
              <input
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                name="desconto"
                value={info.desconto}
                placeholder="Ex: R$ 500,00 ou 10%"
                onChange={(e) => setInfo({ ...info, desconto: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Forma de Pagamento
              </div>
            </label>
            <input
              className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              name="pagamento"
              value={info.pagamento}
              placeholder="Ex: À vista, 2x sem juros, etc."
              onChange={(e) => setInfo({ ...info, pagamento: e.target.value })}
            />
          </div>
        </div>
        
        {/* Resumo do orçamento */}
        <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
          <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Resumo do Orçamento
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="font-bold text-lg text-primary">R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
            </div>
            {info.desconto && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Entrada/Desconto:</span>
                <span className="font-semibold text-green-600">{info.desconto}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-accent/30">
              <span className="text-muted-foreground">Total de itens:</span>
              <span className="font-semibold text-foreground">{produtos.filter(p => p.materialSelecionado).length}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
