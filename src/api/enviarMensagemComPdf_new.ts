import { bot } from '../bot';
import db from '../lib/db';

export default {
  async POST(req: Request) {
    const { numeros, mensagem, cliente_nome, produtos, valor_total } = await req.json();
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
        'CC. 108822-X'
    ];
    
    // Salvar orçamento no banco antes de enviar
    let orcamentoId = null;
    if (cliente_nome && produtos && valor_total) {
      try {
        const result = db.prepare(`
          INSERT INTO orcamentos_enviados 
          (cliente_nome, cliente_numero, produtos, valor_total, tipo_envio, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          cliente_nome,
          numeros[0] || null, // Primeiro número como principal
          JSON.stringify(produtos),
          valor_total,
          'whatsapp_mensagem',
          'enviando'
        );
        orcamentoId = result.lastInsertRowid;
      } catch (e) {
        console.error('Erro ao salvar orçamento:', e);
      }
    }
    
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
    
    // Atualizar status do orçamento após envio
    if (orcamentoId) {
      try {
        const enviados = resultados.filter(r => r.status === 'ok').length;
        const status = enviados > 0 ? 'enviado' : 'erro_envio';
        db.prepare(`
          UPDATE orcamentos_enviados 
          SET status = ?, data_envio = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(status, orcamentoId);
      } catch (e) {
        console.error('Erro ao atualizar status do orçamento:', e);
      }
    }
    
    return new Response(JSON.stringify({ ok: true, resultados }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
