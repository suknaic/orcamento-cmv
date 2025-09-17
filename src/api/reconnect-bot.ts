import { bot } from '../bot';

export const POST = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  try {
    console.log("🔄 Iniciando reconexão do bot do WhatsApp...");

    // Primeiro verificamos o status atual
    const statusAtual = await bot.isConnected();
    console.log("Status atual antes da reconexão:", statusAtual);

    // Usamos o método reiniciar do bot que já implementa toda a lógica
    console.log("🚀 Reiniciando o bot do WhatsApp...");
    const resultado = await bot.reiniciar();
    
    if (resultado) {
      console.log("✅ Reconexão concluída com sucesso!");
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: "Bot reiniciado com sucesso",
          prevStatus: statusAtual
        }), 
        { 
          status: 200,
          headers
        }
      );
    } else {
      console.error("❌ Falha na reconexão");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          message: "Falha ao reiniciar o bot. Tente novamente.",
          prevStatus: statusAtual
        }), 
        { 
          status: 500,
          headers
        }
      );
    }
  } catch (e) {
    console.error("❌ Erro crítico durante a reconexão:", e);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: e instanceof Error ? e.message : String(e),
        message: "Erro crítico durante a reconexão do bot. Verifique os logs do servidor."
      }), 
      { 
        status: 500,
        headers
      }
    );
  }
};
