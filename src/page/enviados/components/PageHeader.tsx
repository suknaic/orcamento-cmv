import React from "react";

export function PageHeader() {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center gap-3 mb-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Orçamentos Enviados</h1>
      </div>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Gerencie e acompanhe todos os orçamentos enviados aos seus clientes. Reenvie propostas quando necessário.
      </p>
    </div>
  );
}
