import { getContacts } from '../bot';

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') || '300');
  const query = (url.searchParams.get('q') || '').trim();

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const result = await getContacts({
      limit: Number.isFinite(limit) && limit > 0 ? limit : 300,
      query,
    });

    return new Response(
      JSON.stringify({
        contatos: result.contatos,
        total: result.total,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 300,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return new Response(JSON.stringify({ error: 'Falha ao buscar contatos do WhatsApp' }), { status: 500, headers });
  }
};
