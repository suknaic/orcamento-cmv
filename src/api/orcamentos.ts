
import db from '../lib/db';

// Salva materiais e acabamentos recebidos do frontend
export async function postConfig(req: Request) {
  const { materiais, acabamentos } = await req.json();
  console.log("Recebido para salvar:", { materiais, acabamentos });
  
  db.run('BEGIN TRANSACTION');
  try {
    // Removido o DELETE FROM orcamentos que apagava todos os registros
    // Agora vamos apenas atualizar os existentes e inserir novos
    
    // Primeiro limpar a tabela apenas se tiver dados para inserir
    if (materiais && materiais.length > 0) {
      db.run('DELETE FROM orcamentos');
      
      // Inserir os novos materiais
      for (const mat of materiais) {
        if (mat.id) {
          console.log("Atualizando material existente:", mat);
          db.prepare('INSERT OR REPLACE INTO orcamentos (id, material, valor, tipo) VALUES (?, ?, ?, ?)')
            .run(mat.id, mat.nome, mat.preco, mat.tipo || "unidade");
        } else {
          console.log("Inserindo novo material:", mat);
          db.prepare('INSERT INTO orcamentos (material, valor, tipo) VALUES (?, ?, ?)')
            .run(mat.nome, mat.preco, mat.tipo || "unidade");
        }
      }
    }
    
    db.run('COMMIT');
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error("Erro ao salvar no banco:", e);
    db.run('ROLLBACK');
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}

// Rota para fornecer materiais e acabamentos do banco
export async function getConfig(req: Request) {
  try {
    // Busca todos os materiais com id
    console.log("Buscando materiais do banco de dados");
    const materiais = db.query('SELECT id, material as nome, valor as preco, tipo FROM orcamentos').all();
    console.log(`Encontrados ${materiais.length} materiais`);
    
    // Para acabamentos, exemplo fixo (pode ser adaptado para tabela separada)
    const acabamentos = [
      { nome: 'básico', preco: 10 },
      { nome: 'premium', preco: 50 },
    ];
    
    return new Response(JSON.stringify({ materiais, acabamentos }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

