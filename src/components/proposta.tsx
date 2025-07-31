import Header from '../topo-proposta.png';

interface PropostaComercialProps {
  cliente?: string;
  validade?: string;
  desconto?: number;
  pagamento?: string;
  orcamento?: {
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    total: number;
  }[];
  total?: number;
}

const PropostaComercial = ({
  cliente = 'Manoel Roque',
  validade = '20 dias',
  desconto = 10000,
  pagamento = 'À vista',
  orcamento = [
    {
      descricao: 'Fachada em ACM de 18m com letras em PVC e lateral adesivado',
      quantidade: 1,
      valorUnitario: 10000,
      total: 10000,
    },
  ],
  total = 10000,
}: PropostaComercialProps) => {
  // Dados fixos do rodapé
  const rodape = 'CNPJ: 52.548.924/0001-20 | JULIO DESIGNER | travessa da vitória, Nº 165 | bairro: Montanhês | Cep: 69.921-554 | WhatsApp: (68) 99976-0124';
  // Telefone do WhatsApp (será preenchido pelo backend, mas pode ser fixo aqui)
  const whatsapp = '(68) 99976-0124';
  return (
    <div style={{
      maxWidth: '48rem',
      margin: '0 auto',
      padding: '1.5rem',
      color: '#222',
      background: '#fff',
      fontFamily: 'sans-serif',
      fontSize: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Header da proposta */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <img src={Header} alt="Header Proposta" style={{ width: '100%', objectFit: 'contain' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Cliente:</strong> {cliente}</p>
        <p><strong>Designer:</strong> Júlio Eduardo | 📞 (68) 99976-0124</p>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Validade da proposta:</strong> {validade}</p>
        <p><strong>Prazo de entrega:</strong> 2 dias</p>
        <p><strong>Pagamento:</strong> {pagamento}</p>
        {desconto && <p><strong>Entrada:</strong> R$ {desconto.toLocaleString("pt-BR", {minimumFractionDigits:2})}</p>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>#</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Descrição</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Qtd</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Valor Unitário</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orcamento.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{String(idx + 1).padStart(2, '0')}</td>
              <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{item.descricao}</td>
              <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{item.quantidade}</td>
              <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>R$ {item.valorUnitario.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
              <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>R$ {item.total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f9fafb' }}>
            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }} colSpan={4}>Total com Entrada</td>
            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', fontWeight: 700 }}>R$ {total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontStyle: 'italic' }}>Autorizo a confecção deste material por cujo conteúdo me responsabilizo, ciente.</p>
        <p>Júlio Eduardo - Designer Gráfico</p>
        <p>📍 Rio Branco - AC | 17 de Agosto de 2025</p>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#4b5563', border: 'none' }}>
        <p>1. As cores podem variar até 10% para mais claro ou mais escuro.</p>
        <p>2. Não garantimos fidelidade 100% das cores.</p>
        <p>3. Após aprovação, erros ortográficos serão responsabilidade do cliente.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: '3rem', marginTop: '9rem', marginBottom: '10rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '220px', borderBottom: '2px solid #9ca3af', marginBottom: '0.5rem' }}></div>
          <span style={{ color: '#374151', fontSize: '0.875rem' }}>Assinatura do Cliente</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '220px', borderBottom: '2px solid #9ca3af', marginBottom: '0.5rem' }}></div>
          <span style={{ color: '#374151', fontSize: '0.875rem' }}>Assinatura do Designer</span>
        </div>
      </div>

      {/* Rodapé reduzido: apenas CNPJ e WhatsApp em linha */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.7rem', color: '#374151', fontSize: '12px', textAlign: 'center', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1.2rem', textTransform: 'uppercase' }}>
        <span>{rodape}</span>
      </div>
    </div>
  );
};

export { PropostaComercial };