import { sendOrcamento } from '../bot';
import db from '../lib/db';

function addBusinessDays(date: Date, days: number) {
  let result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++;
    }
  }
  return result;
}

export default {
  // Reenviar orçamento para WhatsApp
  async POST(req: Request) {
    const { 
      id, 
      numeros, 
      tipo = 'mensagem',
      cliente_nome,
      validade,
      desconto,
      pagamento
    } = await req.json();
    
    if (!id || !Array.isArray(numeros) || numeros.length === 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'ID do orçamento e números são obrigatórios' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      // Buscar orçamento
      const orcamento = db.prepare('SELECT * FROM orcamentos_enviados WHERE id = ?').get(id) as any;
      
      if (!orcamento) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Orçamento não encontrado' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const produtos = JSON.parse(orcamento.produtos);
      
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
      
      // Gerar mensagem do orçamento
      const agora = new Date();
      const dataStr = agora.toLocaleDateString("pt-BR");
      const horaStr = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      
      const prazoProducao = 2;
      const previsaoEntrega = addBusinessDays(agora, prazoProducao);
      const previsaoStr = previsaoEntrega.toLocaleDateString("pt-BR");
      
      const produtosLista = produtos.map((p: any) => {
        if (!p.descricao) return '';
        const quantidade = p.quantidade || 1;
        const valorUnit = (p.valorUnitario || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        const subtotal = (p.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

        return `*${p.descricao.trim()}*
- Quantidade: ${quantidade}
- Valor Unit.: R$ ${valorUnit}
- Subtotal: *R$ ${subtotal}*`;
      }).filter(Boolean).join('\n-----------------------------------\n');

      const valorTotal = (orcamento.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

      const mensagem = [
        '*- ORÇAMENTO JULIO DESIGNER -*',
        '',
        `Olá, ${orcamento.cliente_nome}! Segue o seu orçamento solicitado.`,
        '',
        '📝 *PRODUTOS*',
        '-----------------------------------',
        produtosLista,
        '-----------------------------------',
        '',
        `💰 *VALOR TOTAL: R$ ${valorTotal}*`,
        '',
        '📋 *INFORMAÇÕES ADICIONAIS*',
        `- Validade da proposta: *7 dias*`,
        `- Prazo de produção: *${prazoProducao} dias úteis*`,
        `- Previsão de entrega: *${previsaoStr}*`,
        '',
        '🏦 *DADOS PARA PAGAMENTO*',
        '- PIX: 6899976-0124',
        '- BANCO DO BRASIL',
        '- AG. 2358-2',
        '- CC. 108822-X',
        '',
        'Qualquer dúvida, estou à disposição!',
        '',
        '---',
        '*JULIO DESIGNER*',
        '_CNPJ: 52.548.924/0001-20_',
        '_WhatsApp: (68) 99976-0124_',
      ].join('\n');
      
      const resultados = [];
      
      for (const numero of numeros) {
        try {
          if (tipo === 'pdf') {
            // Reenviar PDF - usar a mesma mensagem e gerar PDF
            const mensagemPDF = [
              `*ORÇAMENTO PARA: ${orcamento.cliente_nome}*`,
              '',
              '',
              `Valor total: *R$${orcamento.valor_total.toLocaleString("pt-BR", {minimumFractionDigits:2})}*`,
              `Validade: 7 dias`,
              `Prazo de produção: ${prazoProducao} dias úteis`,
              `Data: ${dataStr}`,
              `Hora: ${horaStr}`,
              `Previsão para entrega: ${previsaoStr}`,
              '',
              rodape.join('\n'),
              '',
              dadosBancarios.join('\n')
            ].join('\n');
            
            // Por enquanto, vamos enviar só a mensagem mesmo
            // TODO: Implementar geração do PDF no backend
            await sendOrcamento(numero, mensagem);
            resultados.push({ numero, status: 'ok' });
          } else {
            await sendOrcamento(numero, mensagem);
            resultados.push({ numero, status: 'ok' });
          }
        } catch (e) {
          resultados.push({ numero, status: 'erro', erro: String(e) });
        }
      }
      
      // Atualizar status do orçamento
      db.prepare(`
        UPDATE orcamentos_enviados 
        SET status = 'reenviado', data_envio = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      
      return new Response(JSON.stringify({ 
        ok: true, 
        resultados,
        orcamento: orcamento.cliente_nome
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Erro ao reenviar orçamento: ' + error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
};
