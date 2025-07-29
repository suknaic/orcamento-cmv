import { bot } from '../bot';

export const POST = async () => {
  try {
    await bot.disconnect();
    setTimeout(() => {
      bot.initialize();
    }, 1000); // Aguarda 1s para garantir desconexão
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};
