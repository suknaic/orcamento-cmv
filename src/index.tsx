import './bot'
import { serve } from "bun";
import index from "./index.html";
import { getConfig, postConfig } from "./api/orcamentos";

const server = serve({
  idleTimeout: 255, // Define o tempo limite de inatividade em segundos
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/config": {
      async GET(req) {
        return getConfig(req);
      },
      async POST(req) {
        return postConfig(req);
      },
    },

    // Rota para contatos do WhatsApp
    "/api/contatos": {
      async GET(req) {
        const mod = await import("./api/contatos.ts");
        if (typeof mod.GET === 'function') {
          return mod.GET(req);
        } else {
          console.error("API Error: contatos.ts não exporta uma função GET");
          return new Response(
            JSON.stringify({ 
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
    },

    // Rota para envio de mensagem WhatsApp
    "/api/enviarMensagem": {
      async POST(req) {
        const mod = await import("./api/enviarMensagem.ts");
        if (typeof mod.POST === 'function') {
          return mod.POST(req);
        } else {
          console.error("API Error: enviarMensagem.ts não exporta uma função POST");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
    },

    "/api/enviarPDF": {
      async POST(req) {
        const mod = await import("./api/enviarPDF.ts");
        if (typeof mod.POST === 'function') {
          return mod.POST(req);
        } else {
          console.error("API Error: enviarPDF.ts não exporta uma função POST");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
    },

    "/api/reconnect-bot": {
      async POST(req) {
        const mod = await import("./api/reconnect-bot.ts");
        if (typeof mod.POST === 'function') {
          return mod.POST();
        } else {
          console.error("API Error: reconnect-bot.ts não exporta uma função POST");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
    },

    "/api/bot-status": {
      async GET(req) {
        const mod = await import("./api/bot-status.ts");
        if (typeof mod.GET === 'function') {
          return mod.GET();
        } else {
          console.error("API Error: bot-status.ts não exporta uma função GET");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
    },

    // Rota para orçamentos enviados
    "/api/orcamentosEnviados": {
      async GET(req) {
        const mod = await import("./api/orcamentosEnviados.ts");
        if (mod.default && typeof mod.default.GET === 'function') {
          return mod.default.GET(req);
        } else {
          console.error("API Error: orcamentosEnviados.ts não exporta uma função GET");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
      async POST(req) {
        const mod = await import("./api/orcamentosEnviados.ts");
        if (mod.default && typeof mod.default.POST === 'function') {
          return mod.default.POST(req);
        } else {
          console.error("API Error: orcamentosEnviados.ts não exporta uma função POST");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
      async PUT(req) {
        const mod = await import("./api/orcamentosEnviados.ts");
        if (mod.default && typeof mod.default.PUT === 'function') {
          return mod.default.PUT(req);
        } else {
          console.error("API Error: orcamentosEnviados.ts não exporta uma função PUT");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
      async OPTIONS(req) {
        const mod = await import("./api/orcamentosEnviados.ts");
        if (mod.default && typeof mod.default.OPTIONS === 'function') {
          return mod.default.OPTIONS(req);
        } else {
          console.error("API Error: orcamentosEnviados.ts não exporta uma função OPTIONS");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
    },

    // Rota para reenvio de orçamentos
    "/api/reenviarOrcamento": {
      async POST(req) {
        const mod = await import("./api/reenviarOrcamento.ts");
        if (mod.default && typeof mod.default.POST === 'function') {
          return mod.default.POST(req);
        } else {
          console.error("API Error: reenviarOrcamento.ts não exporta uma função POST");
          return new Response(
            JSON.stringify({ 
              ok: false,
              error: "API Error: Erro interno do servidor",
              timestamp: new Date().toISOString() 
            }), 
            {
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
        }
      },
    }
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
