import Database from 'bun:sqlite';

const db = new Database('orcamentos.db');

// Verificar tabelas
const tables = db.query(`SELECT name FROM sqlite_master WHERE type='table'`).all();
console.log('Tabelas:', tables);

// Verificar orçamentos enviados
try {
  console.log('\n=== Orçamentos Enviados ===');
  const orcamentos = db.query('SELECT id, cliente_nome, cliente_numero, valor_total, tipo_envio, status, data_criacao, data_envio FROM orcamentos_enviados ORDER BY id DESC LIMIT 10').all();
  
  if (orcamentos.length === 0) {
    console.log('Nenhum orçamento enviado encontrado');
  } else {
    console.log(`Encontrados ${orcamentos.length} orçamentos:`);
    orcamentos.forEach(orc => {
      console.log(`\nID: ${orc.id}`);
      console.log(`Cliente: ${orc.cliente_nome}`);
      console.log(`Número: ${orc.cliente_numero || 'N/A'}`);
      console.log(`Valor: R$ ${orc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`Tipo: ${orc.tipo_envio}`);
      console.log(`Status: ${orc.status}`);
      console.log(`Criado: ${orc.data_criacao}`);
      console.log(`Enviado: ${orc.data_envio || 'Não enviado'}`);
    });
  }
} catch (e) {
  console.error('Erro ao acessar a tabela orcamentos_enviados:', e);
}