import { bot } from '../bot';

export const POST = async () => {
  try {

    // Sempre desconecta antes de inicializar para garantir ciclo completo
    await bot.disconnect();

    // Aguarda reconexão e responde apenas após sucesso ou erro
    const reconectar = async () => {
      try {
        await bot.initialize();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    };

    // Aguarda 1s para garantir desconexão
    await new Promise(res => setTimeout(res, 1000));
    const result = await reconectar();
    if (result.ok) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};
