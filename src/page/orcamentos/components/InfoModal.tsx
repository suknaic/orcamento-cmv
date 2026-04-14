import React from 'react';
import { useOrcamentoContext } from '../contexts/OrcamentoContext';
import { Modal } from '@/components/ui/modal';
import { CancelButton, SendButton, Button } from '@/components/ui/button-variants';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PropostaComercial } from '@/components/proposta';

function adicionarCanvasPaginadoAoPdf(
  pdf: any,
  canvas: HTMLCanvasElement,
  node: HTMLElement,
  imgWidthMm = 210,
  pageHeightMm = 297
) {
  const getTopRelativo = (el: HTMLElement, root: HTMLElement): number => {
    let top = 0;
    let atual: HTMLElement | null = el;
    while (atual && atual !== root) {
      top += atual.offsetTop || 0;
      atual = atual.offsetParent as HTMLElement | null;
    }
    return top;
  };

  const unirRanges = (ranges: Array<{ top: number; bottom: number }>) => {
    if (ranges.length === 0) return ranges;
    const ordenados = [...ranges].sort((a, b) => a.top - b.top);
    const unidos: Array<{ top: number; bottom: number }> = [ordenados[0]];

    for (let i = 1; i < ordenados.length; i++) {
      const ultimo = unidos[unidos.length - 1];
      const atual = ordenados[i];
      if (atual.top <= ultimo.bottom) {
        ultimo.bottom = Math.max(ultimo.bottom, atual.bottom);
      } else {
        unidos.push({ ...atual });
      }
    }

    return unidos;
  };

  const pageHeightCanvasPx = (pageHeightMm * canvas.width) / imgWidthMm;
  const scaleRatio = canvas.height / Math.max(node.scrollHeight, 1);

  const blocosNaoQuebrar = Array.from(
    node.querySelectorAll('[data-pdf-no-split="true"]')
  ) as HTMLElement[];
  const blocosQuebraAntes = Array.from(
    node.querySelectorAll('[data-pdf-page-break-before="true"]')
  ) as HTMLElement[];

  const ranges = unirRanges(
    blocosNaoQuebrar
    .map((el) => {
      const top = getTopRelativo(el, node) * scaleRatio;
      const bottom = top + (el.offsetHeight || 0) * scaleRatio;
      return { top, bottom };
    })
    .filter((r) => r.bottom > r.top)
  );
  const quebrasForcadas = blocosQuebraAntes
    .map((el) => getTopRelativo(el, node) * scaleRatio)
    .filter((top) => Number.isFinite(top) && top > 1)
    .sort((a, b) => a - b);

  const segmentos: Array<{ start: number; end: number }> = [];
  const minSlicePx = pageHeightCanvasPx * 0.6;
  const margemSegurancaPx = pageHeightCanvasPx * 0.05;
  let start = 0;

  while (start < canvas.height - 1) {
    let end = Math.min(start + pageHeightCanvasPx, canvas.height);

    const quebraForcada = quebrasForcadas.find((q) => q > start + 10 && q < end - 10);
    if (quebraForcada !== undefined) {
      end = quebraForcada;
    }

    if (end < canvas.height && quebraForcada === undefined) {
      const crossing = ranges.find((r) => r.top < end && r.bottom > end);
      if (crossing) {
        const before = crossing.top - start;
        const after = crossing.bottom - start;

        if (before >= minSlicePx) {
          end = Math.max(start + minSlicePx, crossing.top - margemSegurancaPx);
        } else if (after <= pageHeightCanvasPx - margemSegurancaPx) {
          end = Math.min(canvas.height, crossing.bottom + margemSegurancaPx);
        }
      }
    }

    if (end <= start + 10) {
      end = Math.min(start + pageHeightCanvasPx, canvas.height);
    }

    segmentos.push({ start, end });
    start = end;
  }

  segmentos.forEach((seg, index) => {
    const sliceHeight = Math.max(1, Math.floor(seg.end - seg.start));
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;

    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      canvas,
      0,
      seg.start,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const imgData = sliceCanvas.toDataURL('image/jpeg', 0.9);
    const imgHeightMm = (sliceHeight * imgWidthMm) / canvas.width;

    if (index > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
  });
}

export function InfoModal() {
  const {
    showInfoModal,
    setShowInfoModal,
    info,
    setInfo,
    valorTotal,
    produtos,
    orcamentoData,
    orcamentoDataPdf,
    loadingEnviar,
    propostaRef,
    abrirModalContatos // Importar a função centralizada
  } = useOrcamentoContext();

  if (!showInfoModal) return null;

  return (
    <Modal
      isOpen={!!showInfoModal}
      onClose={() => setShowInfoModal(false)}
      title="Finalizar Orçamento"
      subtitle="Complete as informações para gerar o orçamento"
      variant="default"
      size="lg"
      footer={
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
          <CancelButton onClick={() => setShowInfoModal(false)} />
          <SendButton
            onClick={() => {
              setShowInfoModal(false); // Fecha o modal atual
              abrirModalContatos('pdf'); // Chama a função correta para abrir o modal de contatos
            }}
            loading={loadingEnviar}
          >
            Continuar para Envio PDF
          </SendButton>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                if (!propostaRef.current) {
                  toast.error("Erro ao gerar PDF: componente não encontrado");
                  return;
                }

                // Cria um elemento temporário para renderizar o componente PropostaComercial
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '0';
                document.body.appendChild(tempDiv);

                // Configura o estilo do div temporário
                Object.assign(tempDiv.style, {
                  width: '800px',
                  background: '#fff',
                  border: 'none',
                  boxShadow: 'none',
                  outline: 'none'
                });

                // Renderiza o componente PropostaComercial no div temporário
                const descontoAplicado = info.desconto ? parseFloat(info.desconto.replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
                
                // Usa ReactDOM para renderizar o componente no div temporário
                const ReactDOM = await import('react-dom/client');
                const root = ReactDOM.createRoot(tempDiv);
                
                // Renderiza o componente
                root.render(
                  <PropostaComercial
                    cliente={info.cliente || "Cliente"}
                    validade={info.validade || "7 dias"}
                    desconto={descontoAplicado}
                    pagamento={info.pagamento || "À vista"}
                    orcamento={orcamentoDataPdf}
                    total={valorTotal}
                  />
                );

                // Aguarda um momento para garantir que o componente seja renderizado
                await new Promise(resolve => setTimeout(resolve, 500));

                // Aguardar carregamento de imagens
                const images = tempDiv.querySelectorAll('img');
                if (images.length > 0) {
                  console.log(`Encontradas ${images.length} imagens para carregar`);
                  await Promise.all(
                    Array.from(images).map((img: HTMLImageElement) => {
                      return new Promise((resolve) => {
                        if (img.complete) {
                          console.log("Imagem já carregada:", img.src);
                          resolve(null);
                        } else {
                          console.log("Aguardando carregamento da imagem:", img.src);
                          img.onload = () => {
                            console.log("Imagem carregada com sucesso:", img.src);
                            resolve(null);
                          };
                          img.onerror = (e) => {
                            console.error("Erro ao carregar imagem:", img.src, e);
                            resolve(null);
                          };
                        }
                      });
                    })
                  );
                  
                  // Aguarda um pouco mais após o carregamento das imagens
                  await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Captura o componente com html2canvas
                const canvas = await html2canvas(tempDiv, {
                  backgroundColor: "#fff",
                  scale: 2,
                  useCORS: true,
                  allowTaint: true,
                  logging: true,
                  imageTimeout: 5000,
                  width: tempDiv.scrollWidth,
                  height: tempDiv.scrollHeight,
                  onclone: (clonedDoc) => {
                    // Verifica se as imagens foram clonadas corretamente
                    const clonedImages = clonedDoc.querySelectorAll('img');
                    console.log(`Imagens clonadas: ${clonedImages.length}`);
                  }
                });

                // Gera o PDF
                const pdf = new jsPDF("p", "mm", "a4");
                adicionarCanvasPaginadoAoPdf(pdf, canvas, tempDiv, 210, 297);

                pdf.save(`Orcamento_${info.cliente || "Cliente"}.pdf`);

                // Remove o div temporário
                document.body.removeChild(tempDiv);
                root.unmount();

                toast.success("PDF salvo com sucesso!");
              } catch (error) {
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
              <span className="font-semibold text-foreground">{produtos.filter(p => p.produto.nome && p.quantidadeTotal > 0).length}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
