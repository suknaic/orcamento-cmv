
import db from '../lib/db';

// Salva materiais e acabamentos recebidos do frontend
export async function postConfig(req: Request) {
  const { materiais, acabamentos } = await req.json();
  db.run('BEGIN TRANSACTION');
  try {
    db.run('DELETE FROM orcamentos');
    for (const mat of materiais) {
      if (mat.id) {
        db.prepare('INSERT OR REPLACE INTO orcamentos (id, material, valor, tipo) VALUES (?, ?, ?, ?)')
          .run(mat.id, mat.nome, mat.preco, mat.tipo || "unidade");
      } else {
        db.prepare('INSERT INTO orcamentos (material, valor, tipo) VALUES (?, ?, ?)')
          .run(mat.nome, mat.preco, mat.tipo || "unidade");
      }
    }
    db.run('COMMIT');
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    db.run('ROLLBACK');
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}

// Rota para fornecer materiais e acabamentos do banco
export async function getConfig(req: Request) {
  // Busca todos os materiais com id
  const materiais = db.query('SELECT id, material as nome, valor as preco, tipo FROM orcamentos').all();
  // Para acabamentos, exemplo fixo (pode ser adaptado para tabela separada)
  const acabamentos = [
    { nome: 'básico', preco: 10 },
    { nome: 'premium', preco: 50 },
  ];
  return new Response(JSON.stringify({ materiais, acabamentos }), { headers: { 'Content-Type': 'application/json' } });
}

