import { bot } from '../bot';

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
  return new Response(JSON.stringify({ ok: true, resultados }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export default { POST };
