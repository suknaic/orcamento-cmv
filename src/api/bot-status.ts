import { getBotStatus } from '../bot';

export const GET = async () => {
  try {
    const status = await getBotStatus();
    return new Response(
      JSON.stringify({
        connected: status.connected,
        status: status.connected ? "connected" : "disconnected",
        qr: status.qr,
        message: status.message,
        state: status.state,
        timestamp: status.updatedAt,
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
