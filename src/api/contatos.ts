
import { bot } from '../bot';

export async function GET(req: Request) {
  try {
    console.log("API: Buscando chats individuais do WhatsApp...");
    const chatsIndividuais = await bot.getChatsIndividuais();
    console.log(`API: Encontrados ${chatsIndividuais.length} chats`);
    
    // Como o bot.getChatsIndividuais() já retorna os contatos no formato correto,
    // não precisamos mais fazer o mapeamento aqui
    
    return new Response(
      JSON.stringify({ 
        contatos: chatsIndividuais,
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
  } catch (error) {
    console.error("API: Erro ao obter contatos do WhatsApp:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        contatos: [],
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
}
