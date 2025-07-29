import { bot } from '../bot';

export default {
  async POST(req: Request) {
    const { numeros, mensagem } = await req.json();
    if (!Array.isArray(numeros) || !mensagem) {
      return new Response(JSON.stringify({ ok: false, error: 'Dados inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const resultados = [];
    for (const numero of numeros) {

      try {
        await bot.sendMessage(numero, mensagem);
        resultados.push({ numero, status: 'ok' });
      } catch (e) {
        resultados.push({ numero, status: 'erro', erro: String(e) });
      }
    }
    return new Response(JSON.stringify({ ok: true, resultados }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
