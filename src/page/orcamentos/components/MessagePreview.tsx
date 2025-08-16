import React from 'react';
import { useOrcamentoContext } from '../contexts/OrcamentoContext';

export function MessagePreview() {
  const { mensagem } = useOrcamentoContext();

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 border border-border rounded-xl p-6">
        <label className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Prévia da Mensagem WhatsApp
        </label>
        <textarea
          className="border border-input rounded-lg px-4 py-4 w-full text-sm bg-background text-foreground resize-none font-mono leading-relaxed"
          rows={12}
          value={mensagem}
          readOnly
        />
        <p className="text-xs text-muted-foreground mt-2">
          Esta é a mensagem que será enviada via WhatsApp
        </p>
      </div>
    </div>
  );
}
