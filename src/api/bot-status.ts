import { bot } from '../bot';

export const GET = async () => {
  try {
    const isConnected = await bot.isConnected();
    
    return new Response(
      JSON.stringify({
        connected: isConnected,
        status: isConnected ? "connected" : "disconnected"
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ 
        connected: false, 
        status: "error",
        error: String(e) 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
