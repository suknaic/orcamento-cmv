import { bot } from '../bot';
import db from '../lib/db';

const POST = async (req: Request) => {
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

  let numeros: string[] = [];
  try {
    numeros = JSON.parse(numerosRaw as string);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Números inválidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(numeros) || !file) {
    return new Response(JSON.stringify({ ok: false, error: 'Dados inválidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Salvar orçamento no banco antes de enviar
  let orcamentoId = null;
  if (clienteNome && produtosRaw && valorTotal > 0) {
    try {
      const produtos = JSON.parse(produtosRaw);
      const result = db.prepare(`
        INSERT INTO orcamentos_enviados 
        (cliente_nome, cliente_numero, produtos, valor_total, tipo_envio, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        clienteNome,
        numeros[0] || null,
        JSON.stringify(produtos),
        valorTotal,
        'whatsapp_pdf',
        'enviando'
      );
      orcamentoId = result.lastInsertRowid;
    } catch (e) {
      console.error('Erro ao salvar orçamento PDF:', e);
    }
  }

  // Detecta mimetype e lê buffer
  const mimetype = (file as any).type || 'application/pdf';
  const buffer = Buffer.from(await (file as any).arrayBuffer());
  const base64 = buffer.toString('base64');
  const filename = (file as any).name || 'proposta.pdf';

  const resultados = [];
  for (const numero of numeros) {
    try {
      await bot.sendOrcamentoPDF(numero, mensagem as string, {
        mimetype,
        data: base64,
        filename,
      });
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
      console.error('Erro ao atualizar status do orçamento PDF:', e);
    }
  }
  
  return new Response(JSON.stringify({ ok: true, resultados }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export default { POST };
