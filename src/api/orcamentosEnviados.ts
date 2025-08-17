import db from '../lib/db';

export default {
  // Listar orçamentos enviados com paginação e busca
  async GET(req: Request) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const sortBy = url.searchParams.get('sortBy') || 'data_criacao';
    const sortOrder = url.searchParams.get('sortOrder') || 'DESC';
   
    const offset = (page - 1) * limit;
    
    // Query base - construir condições WHERE
    let whereClauses = [];
    let params: any[] = [];
    
    // Filtro de busca por texto
    if (search) {
      whereClauses.push('(cliente_nome LIKE ? OR cliente_numero LIKE ? OR produtos LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Filtro por status
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    
    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    // Validar campos de ordenação
    const validSortFields = ['id', 'cliente_nome', 'valor_total', 'data_criacao', 'data_envio', 'status'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'data_criacao';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Buscar orçamentos
    const query = `
      SELECT * FROM orcamentos_enviados 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM orcamentos_enviados 
      ${whereClause}
    `;
    
    try {
      const orcamentos = db.prepare(query).all(...params, limit, offset);
      const [{ total }] = db.prepare(countQuery).all(...params) as [{ total: number }];
      
      // Parse dos produtos JSON
      const orcamentosFormatados = orcamentos.map((orc: any) => ({
        ...orc,
        produtos: JSON.parse(orc.produtos)
      }));
      
      return new Response(JSON.stringify({
        ok: true,
        orcamentos: orcamentosFormatados,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Erro ao buscar orçamentos: ' + error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // Salvar novo orçamento
  async POST(req: Request) {
    const { 
      cliente_nome, 
      cliente_numero, 
      produtos, 
      valor_total, 
      tipo_envio = 'criado' 
    } = await req.json();
    
    if (!cliente_nome || !produtos || !valor_total) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Dados obrigatórios: cliente_nome, produtos, valor_total' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      const result = db.prepare(`
        INSERT INTO orcamentos_enviados 
        (cliente_nome, cliente_numero, produtos, valor_total, tipo_envio, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        cliente_nome,
        cliente_numero || null,
        JSON.stringify(produtos),
        valor_total,
        tipo_envio,
        'criado'
      );
      
      return new Response(JSON.stringify({ 
        ok: true, 
        id: result.lastInsertRowid 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Erro ao salvar orçamento: ' + error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // Atualizar status do orçamento (reenvio)
  async PUT(req: Request) {
    const { id, status, data_envio, tipo_envio } = await req.json();
    
    if (!id) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'ID do orçamento é obrigatório' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    try {
      const updateFields = [];
      const params = [];
      
      if (status) {
        updateFields.push('status = ?');
        params.push(status);
      }
      
      if (data_envio) {
        updateFields.push('data_envio = ?');
        params.push(data_envio);
      }
      
      if (tipo_envio) {
        updateFields.push('tipo_envio = ?');
        params.push(tipo_envio);
      }
      
      params.push(id);
      
      const result = db.prepare(`
        UPDATE orcamentos_enviados 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...params);
      
      if (result.changes === 0) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Orçamento não encontrado' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Erro ao atualizar orçamento: ' + error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // Obter estatísticas dos orçamentos
  async OPTIONS(req: Request) {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_orcamentos,
          SUM(valor_total) as valor_total_geral,
          COUNT(CASE WHEN status = 'enviado' THEN 1 END) as orcamentos_enviados,
          COUNT(CASE WHEN status = 'criado' THEN 1 END) as orcamentos_criados,
          AVG(valor_total) as valor_medio
        FROM orcamentos_enviados
      `).get() as any;
      
      return new Response(JSON.stringify({
        ok: true,
        stats: {
          totalOrcamentos: stats.total_orcamentos || 0,
          valorTotalGeral: stats.valor_total_geral || 0,
          orcamentosEnviados: stats.orcamentos_enviados || 0,
          orcamentosCriados: stats.orcamentos_criados || 0,
          valorMedio: stats.valor_medio || 0
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Erro ao obter estatísticas: ' + error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
};
