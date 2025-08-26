import React from "react";
import { ToastContainer } from "react-toastify";
import { OrcamentoProvider, useOrcamentoContext } from "./contexts/OrcamentoContext";
import { ProductSelector } from "./components/ProductSelector";
import { OrcamentoActions } from "./components/OrcamentoActions";
import { MessagePreview } from "./components/MessagePreview";
import { InfoModal } from "./components/InfoModal";
import { ContactSelectionModal } from "./components/ContactSelectionModal";
import { ConfirmNameModal } from "./components/ConfirmNameModal";
import { PropostaComercial } from "@/components/proposta";
import "react-toastify/dist/ReactToastify.css";

function OrcamentoPageContent() {
  const {
    produtos,
    adicionarProduto,
    propostaRef,
    info,
    orcamentoData,
    valorTotal
  } = useOrcamentoContext();

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
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              Criar Novo Orçamento
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Monte seu orçamento adicionando produtos, configure valores e
              envie via WhatsApp ou PDF profissional
            </p>
          </div>
        </div>

        {/* Seção de Produtos */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    1. Selecionar Produtos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Adicione os produtos e configure suas especificações
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
                  <p className="text-xs text-muted-foreground">Total de itens</p>
                  <p className="text-2xl font-bold text-primary">
                    {produtos.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {produtos.map((_, idx) => (
              <ProductSelector
                key={`produto-${idx}-${produtos[idx].materialSelecionado || "empty"}`}
                produtoIndex={idx}
              />
            ))}

            {/* Botão Adicionar Produto */}
            <button
              type="button"
              className="w-full border-2 border-dashed border-primary/30 rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
              onClick={adicionarProduto}
            >
              <div className="flex flex-col items-center gap-3 text-primary group-hover:text-primary/80">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    Adicionar Novo Produto
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Clique para incluir mais um item ao orçamento
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Seção de Resumo */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  2. Resumo do Orçamento
                </h2>
                <p className="text-sm text-muted-foreground">
                  Confira os valores e visualize sua proposta
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna Esquerda - Ações */}
              <div className="space-y-6">
                <OrcamentoActions />
              </div>

              {/* Coluna Direita - Prévia da Mensagem */}
              <div className="space-y-6">
                <MessagePreview />
              </div>
            </div>
          </div>
        </div>

        {/* Renderização invisível do PropostaComercial para gerar PDF */}
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        >
          <div
            ref={propostaRef}
            className="rounded-none shadow-none border-none isolate"
          >
            <PropostaComercial
              cliente={info.cliente || "Cliente"}
              validade={info.validade || "7 dias"}
              desconto={Number(info.desconto)}
              pagamento={info.pagamento || "À vista"}
              orcamento={orcamentoData}
              total={valorTotal}
            />
          </div>
        </div>
      </div>

      {/* Modais */}
      <InfoModal />
      <ContactSelectionModal />
      <ConfirmNameModal />
    </>
  );
}

export function OrcamentoPage() {
  return (
    <OrcamentoProvider>
      <OrcamentoPageContent />
    </OrcamentoProvider>
  );
}