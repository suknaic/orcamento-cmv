import { bot } from '../bot';

export const POST = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  try {
    console.log("🔄 Iniciando reconexão do bot do WhatsApp...");

    // Obtém informações detalhadas do status atual antes de reconectar
    const statusAtual = await bot.isConnected();
    const statusDetalhado = await bot.getConnectionStatus();
    console.log("Status atual antes da reconexão:", statusAtual);
    console.log("Status detalhado antes da reconexão:", statusDetalhado);

    // Usamos o método reconnect do bot que já implementa toda a lógica
    console.log("🚀 Reiniciando o bot do WhatsApp...");
    const resultado = await bot.reconnect();
    
    // Verifica novamente o status após a reconexão
    const statusPosReconexao = await bot.isConnected();
    const statusDetalhadoPos = await bot.getConnectionStatus();
    console.log("Status após reconexão:", statusPosReconexao);
    console.log("Status detalhado após reconexão:", statusDetalhadoPos);
    
    if (resultado && resultado.success) {
      console.log("✅ Reconexão concluída com sucesso!");
      return new Response(
        JSON.stringify({ 
          ok: true, 
          success: true,
          message: "Bot reiniciado com sucesso",
          prevStatus: {
            connected: statusAtual,
            details: statusDetalhado
          },
          currentStatus: {
            connected: statusPosReconexao,
            details: statusDetalhadoPos
          }
        }), 
        { 
          status: 200,
          headers
        }
      );
    } else {
      console.error("❌ Falha na reconexão", resultado?.error || "Erro desconhecido");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          success: false,
          message: "Falha ao reiniciar o bot. Tente novamente.",
          error: resultado?.error ? String(resultado.error) : "Erro desconhecido",
          prevStatus: {
            connected: statusAtual,
            details: statusDetalhado
          },
          currentStatus: {
            connected: statusPosReconexao,
            details: statusDetalhadoPos
          }
        }), 
        { 
          status: 500,
          headers
        }
      );
    }
  } catch (e) {
    console.error("❌ Erro crítico durante a reconexão:", e);
    
    // Mesmo em caso de erro, tenta obter o status atual
    let statusAtual = false;
    let statusDetalhado: any = { state: "ERROR", error: String(e) };
    
    try {
      statusAtual = await bot.isConnected();
      statusDetalhado = await bot.getConnectionStatus();
    } catch (statusError) {
      console.error("Erro ao obter status após falha:", statusError);
    }
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        success: false,
        error: e instanceof Error ? e.message : String(e),
        message: "Erro crítico durante a reconexão do bot. Verifique os logs do servidor.",
        currentStatus: {
          connected: statusAtual,
          details: statusDetalhado
        }
      }), 
      { 
        status: 500,
        headers
      }
    );
  }
};
