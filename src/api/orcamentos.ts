import db from '../lib/db';

// Salva materiais e acabamentos recebidos do frontend
export async function postConfig(req: Request) {
  const { materiais, acabamentos } = await req.json();
  // Limpa materiais antigos e insere os novos (simples, para exemplo)
  db.run('DELETE FROM orcamentos');
  for (const mat of materiais) {
    db.prepare('INSERT INTO orcamentos (material, valor, tipo) VALUES (?, ?, ?)').run(mat.nome, mat.preco, mat.tipo || "unidade");
  }
  // Acabamentos não são persistidos no banco, mas poderiam ser salvos em tabela separada
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}

// Rota para fornecer materiais e acabamentos do banco
export async function getConfig(req: Request) {
  // Busca distintos materiais e acabamentos da tabela orcamentos
  const materiais = db.query('SELECT DISTINCT material as nome, valor as preco, tipo FROM orcamentos').all();
  // Para acabamentos, exemplo fixo (pode ser adaptado para tabela separada)
  const acabamentos = [
    { nome: 'básico', preco: 10 },
    { nome: 'premium', preco: 50 },
  ];
  return new Response(JSON.stringify({ materiais, acabamentos }), { headers: { 'Content-Type': 'application/json' } });
}

