import React from "react";
import { ProdutosProvider } from "./contexts/ProdutosContext";
import { PageHeader } from "./components/PageHeader";
import { ProductForm } from "./components/ProductForm";
import { ProductList } from "./components/ProductList";

function ProdutosPageContent() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário lateral */}
          <div className="lg:col-span-1">
            <ProductForm />
          </div>
          {/* Lista de produtos */}
          <div className="lg:col-span-2">
            <ProductList />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProdutosCrudPage() {
  return (
    <ProdutosProvider>
      <ProdutosPageContent />
    </ProdutosProvider>
  );
}
