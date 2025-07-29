
import { bot } from '../bot';

export default {
  async GET(req: Request) {
    const chatsIndividuais = await bot.getChatsIndividuais();

    const resultado = chatsIndividuais.map((chat: any) => ({
      nome: chat.name || chat.contact?.pushname || chat.id.user,
      numero: chat.id.user
    }));

    return new Response(JSON.stringify(resultado), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
