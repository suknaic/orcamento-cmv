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
        return mod.default.GET(req);
      },
    },

    // Rota para envio de mensagem WhatsApp
    "/api/enviarMensagem": {
      async POST(req) {
        const mod = await import("./api/enviarMensagem.ts");
        return mod.default.POST(req);
      },
    },

    "/api/enviarPDF": {
      async POST(req) {
        const mod = await import("./api/enviarMensagemComPdf.ts")
        return mod.default.POST(req);
      },
    },

    "/api/reconnect-bot": {
      async POST(req) {
        const mod = await import("./api/reconnect-bot.ts");
        return mod.POST();
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
