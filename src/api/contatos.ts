import { getChats } from '../bot';

export const GET = async (req: Request) => {
  console.log("Recebida requisição para /api/contatos");

  // Headers para evitar cache
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const chats = await getChats();
    console.log(`Encontrados ${chats.length} chats.`);

    const contatosPromises = chats.map(async (chat: any) => {
      try {
        // Obtém o objeto Contact associado ao chat
        const contato = await chat.getContact();

        const nome = contato.name || contato.pushname || chat.name || chat.id.user;

        return {
          nome: nome,
          numero: chat.id.user
        };
      } catch (error) {
        console.error(`Erro ao processar o chat ${chat.id.user}:`, error);
        return {
          nome: chat.name || chat.id.user, // Fallback em caso de erro
          numero: chat.id.user
        };
      }
    });

    const contatos = (await Promise.all(contatosPromises)).filter(Boolean); // .filter(Boolean) remove nulos

    console.log(`Retornando ${contatos.length} contatos formatados.`);
    return new Response(JSON.stringify({ contatos }), { status: 200, headers });

  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return new Response(JSON.stringify({ error: 'Falha ao buscar contatos do WhatsApp' }), { status: 500, headers });
  }
};
