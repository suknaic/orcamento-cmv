import { bot } from '../bot';
import db from '../lib/db';

export default {
  async POST(req: Request) {
    console.log("Iniciando processamento de envio PDF");
    
    // Espera multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ ok: false, error: 'Content-Type deve ser multipart/form-data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const numerosRaw = formData.get('numeros');
    const mensagem = formData.get('mensagem') || '';
    const file = formData.get('pdf');
    const clienteNome = formData.get('cliente_nome') as string;
    const produtosRaw = formData.get('produtos') as string;
    const valorTotal = parseFloat(formData.get('valor_total') as string || '0');

    console.log(`Processando envio de PDF para o cliente: ${clienteNome}, valor: ${valorTotal}`);

    let numeros: string[] = [];
    try {
      numeros = JSON.parse(numerosRaw as string);
      console.log(`Números para envio: ${numeros.join(", ")}`);
    } catch (e) {
      console.error("Erro ao processar números:", e);
      return new Response(JSON.stringify({ ok: false, error: 'Números inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(numeros) || !file) {
      console.error("Dados inválidos:", { numeros, temArquivo: !!file });
      return new Response(JSON.stringify({ ok: false, error: 'Dados inválidos: números ou arquivo PDF' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Salvar orçamento no banco antes de enviar
    let orcamentoId = null;
    if (clienteNome && produtosRaw && valorTotal > 0) {
      try {
        console.log("Tentando salvar orçamento no banco");
        let produtos;
        try {
          produtos = JSON.parse(produtosRaw);
        } catch (e) {
          console.error("Erro ao analisar JSON de produtos:", e);
          produtos = [];
        }
        
        // Garantir que o nome do cliente não seja genérico
        const nomeReal = clienteNome === 'Cliente' ? 'Cliente Desconhecido' : clienteNome;
        
        db.run('BEGIN TRANSACTION');
        const result = db.prepare(`
          INSERT INTO orcamentos_enviados 
          (cliente_nome, cliente_numero, produtos, valor_total, tipo_envio, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          nomeReal,
          numeros[0] || null,
          JSON.stringify(produtos),
          valorTotal,
          'whatsapp_pdf',
          'enviando'
        );
        
        orcamentoId = result.lastInsertRowid;
        console.log(`Orçamento salvo com ID: ${orcamentoId}`);
        db.run('COMMIT');
      } catch (e) {
        db.run('ROLLBACK');
        console.error('Erro ao salvar orçamento PDF no banco:', e);
      }
    } else {
      console.error("Dados insuficientes para salvar orçamento:", { 
        temCliente: !!clienteNome, 
        temProdutos: !!produtosRaw, 
        valorTotal 
      });
    }

    // Detecta mimetype e lê buffer
    const mimetype = (file as any).type || 'application/pdf';
    const buffer = Buffer.from(await (file as any).arrayBuffer());
    const base64 = buffer.toString('base64');
    const filename = (file as any).name || 'proposta.pdf';

    console.log(`Arquivo PDF preparado: ${filename}, tamanho: ${buffer.length} bytes`);

    const resultados = [];
    for (const numero of numeros) {
      try {
        console.log(`Enviando PDF para ${numero}`);
        await bot.sendOrcamentoPDF(numero, mensagem as string, {
          mimetype,
          data: base64,
          filename,
        });
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