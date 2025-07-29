import db from './db';


export interface Orcamento {
  id?: number;
  material: string;
  tipo: string;
  valor: number;
  data?: string;
}

export function criarOrcamento(material: string, valor: number, tipo: string): Orcamento {
  const stmt = db.prepare('INSERT INTO orcamentos (material, valor, tipo) VALUES (?, ?, ?)');
  stmt.run(material, valor, tipo);
  const row = db.query('SELECT last_insert_rowid() as id').get() as { id: number };
  return { id: row.id, material, valor, tipo };
}

export function listarOrcamentos(): Orcamento[] {
  return db.query('SELECT * FROM orcamentos ORDER BY data DESC').all() as Orcamento[];
}

export function atualizarOrcamento(id: number, material: string, valor: number, tipo: string): boolean {
  const stmt = db.prepare('UPDATE orcamentos SET material = ?, valor = ?, tipo = ? WHERE id = ?');
  const res = stmt.run(material, valor, tipo, id);
  return res.changes > 0;
}

export function removerOrcamento(id: number): boolean {
  const stmt = db.prepare('DELETE FROM orcamentos WHERE id = ?');
  const res = stmt.run(id);
  return res.changes > 0;
}
