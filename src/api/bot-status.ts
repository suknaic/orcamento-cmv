import { bot } from '../bot';

export const GET = async () => {
  try {
    console.log("Verificando status do bot WhatsApp...");
    const status = await bot.isConnected();
    console.log(`Status do bot: ${status.connected ? "Conectado" : "Desconectado"}`);
    
    return new Response(
      JSON.stringify(status),
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
