import { bot } from '../bot';
import db from '../lib/db';

export default {
  async POST(req: Request) {
    console.log("Iniciando processamento de envio de mensagem WhatsApp");

    const { numeros, mensagem, cliente_nome, produtos, valor_total } = await req.json();
    console.log(`Processando envio para ${cliente_nome}, valor: ${valor_total}, números: ${numeros?.length || 0}`);
    
    if (!Array.isArray(numeros) || !mensagem) {
      console.error("Dados inválidos:", { temNumeros: Array.isArray(numeros), temMensagem: !!mensagem });
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
        console.log("Tentando salvar orçamento no banco");
        // Garantir que o nome do cliente não seja genérico
        const nomeReal = cliente_nome === 'Cliente' ? 'Cliente Desconhecido' : cliente_nome;
        
        db.run('BEGIN TRANSACTION');
        const result = db.prepare(`
          INSERT INTO orcamentos_enviados 
          (cliente_nome, cliente_numero, produtos, valor_total, tipo_envio, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          nomeReal,
          numeros[0] || null, // Primeiro número como principal
          JSON.stringify(produtos),
          valor_total,
          'whatsapp_mensagem',
          'enviando'
        );
        orcamentoId = result.lastInsertRowid;
        console.log(`Orçamento salvo com ID: ${orcamentoId}`);
        db.run('COMMIT');
      } catch (e) {
        db.run('ROLLBACK');
        console.error('Erro ao salvar orçamento:', e);
      }
    } else {
      console.warn("Dados insuficientes para salvar orçamento:", { 
        temCliente: !!cliente_nome, 
        temProdutos: !!produtos, 
        valorTotal: valor_total 
      });
    }
    
    for (const numero of numeros) {
      try {
        console.log(`Enviando mensagem para ${numero}`);
        // Adiciona rodapé ao final da mensagem
        const mensagemFinal = `${mensagem}\n\n${rodape.join("\n")}\n\n${dadosBancarios.join("\n")}`;
        await bot.sendOrcamento(numero, mensagemFinal);
        resultados.push({ numero, status: 'ok' });
        console.log(`Envio para ${numero} concluído com sucesso`);
      } catch (e) {
        console.error(`Erro ao enviar para ${numero}:`, e);
        resultados.push({ numero, status: 'erro', erro: String(e) });
      }
    }
    
    // Atualizar status do orçamento após envio
    if (orcamentoId) {
      try {
        console.log(`Atualizando status do orçamento ${orcamentoId}`);
        const enviados = resultados.filter(r => r.status === 'ok').length;
        const status = enviados > 0 ? 'enviado' : 'erro_envio';
        db.prepare(`
          UPDATE orcamentos_enviados 
          SET status = ?, data_envio = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(status, orcamentoId);
        console.log(`Status atualizado para: ${status}`);
      } catch (e) {
        console.error(`Erro ao atualizar status do orçamento ${orcamentoId}:`, e);
      }
    } else {
      console.warn("Não foi possível atualizar o status pois o orçamento não foi salvo no banco");
    }
    
    return new Response(JSON.stringify({ ok: true, resultados, orcamentoId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
