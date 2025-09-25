import { bot } from '../bot';

export const GET = async () => {
  try {
    console.log("Verificando status do bot WhatsApp...");
    
    // Obter verificação de conexão simples
    const isConnected = await bot.isConnected();
    console.log(`Status do bot: ${isConnected ? "Conectado" : "Desconectado"}`);
    
    // Obter informações detalhadas do status da conexão
    const connectionStatus = await bot.getConnectionStatus();
    console.log("Status detalhado:", connectionStatus);
    
    return new Response(
      JSON.stringify({
        connected: isConnected,
        status: isConnected ? "connected" : "disconnected",
        details: connectionStatus,
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
