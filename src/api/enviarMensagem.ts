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
    // Rodapé fixo
    const rodape = [
      'CNPJ: 52.548.924/0001-20',
      'JULIO DESIGNER',
      'travessa da vitória, Nº 165',
      'bairro: Montanhês',
      'Cep: 69.921-554',
      'WhatsApp: (68) 99976-0124',
    ];

    const dadosBancarios = [
        'PIX 6899976-0124',
        'BANCO DO BRASIL',
        'AG. 2358-2',
        'CC. 108822-X'
    ];
    for (const numero of numeros) {
      try {
        // Adiciona rodapé ao final da mensagem
        const mensagemFinal = `${mensagem}\n\n${rodape.join("\n")}\n\n${dadosBancarios.join("\n")}`;
        await bot.sendOrcamento(numero, mensagemFinal);
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
