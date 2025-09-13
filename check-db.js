import Database from 'bun:sqlite';

const db = new Database('orcamentos.db');

// Verificar tabelas
const tables = db.query(`SELECT name FROM sqlite_master WHERE type='table'`).all();
console.log('Tabelas:', tables);

// Verificar estrutura da tabela orcamentos
try {
  const schema = db.query(`PRAGMA table_info(orcamentos)`).all();
  console.log('Estrutura da tabela orcamentos:', schema);

  // Verificar dados na tabela orcamentos
  const orcamentos = db.query('SELECT * FROM orcamentos LIMIT 5').all();
  console.log('Amostra de orcamentos:', orcamentos);
} catch (e) {
  console.error('Erro ao acessar a tabela orcamentos:', e);
}

// Verificar estrutura da tabela orcamentos_enviados
try {
  const schema = db.query(`PRAGMA table_info(orcamentos_enviados)`).all();
  console.log('Estrutura da tabela orcamentos_enviados:', schema);
} catch (e) {
  console.error('Erro ao acessar a tabela orcamentos_enviados:', e);
}
