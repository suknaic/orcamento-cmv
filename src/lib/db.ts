import Database from 'bun:sqlite';

const db = new Database('orcamentos.db');

db.run(`CREATE TABLE IF NOT EXISTS orcamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material TEXT NOT NULL,
  valor REAL NOT NULL,
  data DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Garante que a coluna 'tipo' existe mesmo em bancos antigos
try {
  db.run('ALTER TABLE orcamentos ADD COLUMN tipo TEXT NOT NULL DEFAULT "unidade"');
} catch (e) {
  // Se já existe, ignora o erro
  if (!String(e).includes('duplicate column')) throw e;
}

// Tabela para armazenar orçamentos enviados/criados
db.run(`CREATE TABLE IF NOT EXISTS orcamentos_enviados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nome TEXT NOT NULL,
  cliente_numero TEXT,
  produtos TEXT NOT NULL,
  valor_total REAL NOT NULL,
  tipo_envio TEXT NOT NULL,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_envio DATETIME,
  status TEXT DEFAULT 'criado'
)`);

export default db;
