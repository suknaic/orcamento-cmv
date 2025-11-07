import { isConnected } from '../bot';

export const GET = async () => {
  try {
    console.log("Verificando status do bot WhatsApp...");
    console.log(`Status do bot: ${isConnected ? "Conectado" : "Desconectado"}`);

    // A variável 'isConnected' é um booleano exportado diretamente de bot.ts
    // e é atualizada pelos eventos do cliente whatsapp-web.js.
    return new Response(
      JSON.stringify({
        connected: isConnected,
        status: isConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (e) {
    console.error("Erro ao verificar status do bot:", e);
    return new Response(
      JSON.stringify({ 
        connected: false, 
        status: "error",
        error: String(e),
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
};
