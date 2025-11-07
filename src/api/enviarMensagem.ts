import { sendOrcamento } from '../bot';
import db from '../lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { numeros, mensagem, numero, cliente_nome, produtos, valor_total } = body;

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

    // Adiciona rodapé ao final da mensagem
    const mensagemFinal = `${mensagem}\n\n${rodape.join("\n")}\n\n${dadosBancarios.join("\n")}`;

    const numerosParaEnvio = numero ? [numero] : (Array.isArray(numeros) ? numeros : []);

    if (numerosParaEnvio.length === 0) {
      throw new Error('É necessário fornecer um número ou array de números');
    }

    // Salvar orçamento no banco antes de enviar
    let orcamentoId: number | bigint | null = null;
    if (cliente_nome && produtos && valor_total > 0) {
      try {
        console.log("Tentando salvar orçamento de texto no banco");

        // O nome do cliente agora é recebido diretamente e é a fonte da verdade.
        const nomeFinal = cliente_nome;

        db.run('BEGIN TRANSACTION');
        const result = db.prepare(`
          INSERT INTO orcamentos_enviados
          (cliente_nome, cliente_numero, produtos, valor_total, tipo_envio, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          nomeFinal,
          numerosParaEnvio[0] || null,
          JSON.stringify(produtos),
          valor_total,
          'whatsapp_texto',
          'enviando'
        );

        orcamentoId = result.lastInsertRowid;
        console.log(`Orçamento (texto) salvo com ID: ${orcamentoId}`);
        db.run('COMMIT');
      } catch (e) {
        db.run('ROLLBACK');
        console.error('Erro ao salvar orçamento (texto) no banco:', e);
        // Não impede o envio, mas loga o erro.
      }
    } else {
      console.warn("Dados insuficientes para salvar orçamento (texto):", {
        temCliente: !!cliente_nome,
        temProdutos: !!produtos,
        valorTotal: valor_total
      });
    }

    const resultados = [];
    for (const num of numerosParaEnvio) {
      try {
        await sendOrcamento(num, mensagemFinal);
        resultados.push({ numero: num, status: 'ok' });
      } catch (e) {
        resultados.push({ numero: num, status: 'erro', erro: String(e) });
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

    // Permite envio para um único número ou um array de números
    return new Response(JSON.stringify({ ok: true, resultados, orcamentoId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
