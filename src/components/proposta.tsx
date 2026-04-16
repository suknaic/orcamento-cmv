// @ts-ignore - Ignore o erro de tipagem para importação de assets
import HeaderImg from '../assets/topo-proposta.png';

interface SubprodutoDetalhado {
  nome: string;
  medida: string;
  quantidade: number | null;
}

const calcularValorUnitarioSubitem = (medida: string, valorBaseProduto: number): number => {
  const medidaNormalizada = medida.toLowerCase().replace(/,/g, '.');
  const match = medidaNormalizada.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);

  if (!match) return valorBaseProduto;

  const largura = Number(match[1]);
  const altura = Number(match[2]);

  if (!Number.isFinite(largura) || !Number.isFinite(altura)) return valorBaseProduto;

  const areaSubitem = largura * altura;
  return areaSubitem * valorBaseProduto;
};

const parseDescricaoDetalhada = (descricao: string): { descricaoBase: string; subprodutos: SubprodutoDetalhado[] } => {
  const linhas = descricao
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const descricaoBase = linhas[0] || descricao;
  const subprodutos: SubprodutoDetalhado[] = [];

  const regexComponente = /^[•\-*]?\s*([^:]+):\s*([^()]+?)(?:\s*\((\d+)\s*x\))?$/i;

  linhas.slice(1).forEach((linha) => {
    const match = linha.match(regexComponente);
    if (!match) return;

    subprodutos.push({
      nome: match[1].trim(),
      medida: match[2].trim(),
      quantidade: match[3] ? Number(match[3]) : null,
    });
  });

  if (subprodutos.length > 0) {
    return { descricaoBase, subprodutos };
  }

  const medidasStr = descricao.match(/\(([^)]+)\)/);
  if (medidasStr && medidasStr[1]) {
    medidasStr[1]
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
      .forEach((medida, index) => {
        subprodutos.push({
          nome: `Subproduto ${index + 1}`,
          medida,
          quantidade: null,
        });
      });
  }

  return { descricaoBase: descricaoBase.split('(')[0].trim() || descricaoBase, subprodutos };
};

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
    imagens?: {
      src: string;
      legenda: string;
    }[];
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
  
  // Data atual formatada
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const temImagens = orcamento.some((item) => (item.imagens || []).length > 0);
  
  
  return (
    <div style={{
      maxWidth: '48rem',
      margin: '0 auto',
      padding: '1.5rem',
      color: '#222',
      background: '#fff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Header da proposta */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src={HeaderImg} alt="Header Proposta"
            style={{ width: '100%', objectFit: 'contain'}}
          />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Cliente:</strong> {cliente}</p>
        <p><strong>Designer:</strong> Júlio Eduardo | 📞 (68) 99976-0124</p>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>Validade da proposta:</strong> {validade}</p>
        <p><strong>Prazo de entrega:</strong> 2 dias</p>
        <p><strong>Pagamento:</strong> {pagamento}</p>
        {desconto > 0 && <p><strong>Entrada:</strong> R$ {desconto.toLocaleString("pt-BR", {minimumFractionDigits:2})}</p>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>#</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Descrição</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Qtd</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Valor Unidade</th>
            <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orcamento.map((item, idx) => {
            const { descricaoBase, subprodutos } = parseDescricaoDetalhada(item.descricao);
            const quantidadeItemExibicao = subprodutos.length > 0 ? '-' : item.quantidade;
            
            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{String(idx + 1).padStart(2, '0')}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>
                  {descricaoBase}
                  {subprodutos.length > 0 && (
                    <table style={{ width: '100%', marginTop: '0.6rem', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ border: '1px solid #e5e7eb', padding: '0.35rem', textAlign: 'left' }}>Subproduto</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '0.35rem', textAlign: 'left' }}>Medida</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '0.35rem', textAlign: 'left' }}>Qtd</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '0.35rem', textAlign: 'left' }}>V. Unit.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subprodutos.map((subproduto, midx) => (
                          <tr key={midx}>
                            <td style={{ border: '1px solid #e5e7eb', padding: '0.35rem' }}>{subproduto.nome}</td>
                            <td style={{ border: '1px solid #e5e7eb', padding: '0.35rem' }}>{subproduto.medida}</td>
                            <td style={{ border: '1px solid #e5e7eb', padding: '0.35rem' }}>{subproduto.quantidade ? `${subproduto.quantidade}x` : '-'}</td>
                            <td style={{ border: '1px solid #e5e7eb', padding: '0.35rem' }}>
                              R$ {(typeof item.valorUnitario === 'number'
                                ? calcularValorUnitarioSubitem(subproduto.medida, item.valorUnitario)
                                : item.valorUnitario
                              ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{quantidadeItemExibicao}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>R$ {typeof item.valorUnitario === 'number' ? item.valorUnitario.toLocaleString('pt-BR', {minimumFractionDigits:2}) : item.valorUnitario}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>R$ {typeof item.total === 'number' ? item.total.toLocaleString('pt-BR', {minimumFractionDigits:2}) : item.total}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f9fafb' }}>
            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }} colSpan={4}>Total com Entrada</td>
            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', fontWeight: 700 }}>R$ {total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
          </tr>
        </tfoot>
      </table>

      {temImagens && (
        <div
          data-pdf-no-split="true"
          style={{
            marginBottom: '1rem',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Imagens de Referencia
          </h3>

          {orcamento.map((item, itemIndex) => {
            const imagens = item.imagens || [];
            if (imagens.length === 0) return null;

            const nomeItem = parseDescricaoDetalhada(item.descricao).descricaoBase || `Item ${itemIndex + 1}`;

            return (
              <div
                key={`imagens-item-${itemIndex}`}
                data-pdf-no-split="true"
                style={{
                  marginBottom: '0.9rem',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{nomeItem}</p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                  }}
                >
                  {imagens.map((imagem, imgIndex) => (
                    <div
                      key={`item-${itemIndex}-img-${imgIndex}`}
                      data-pdf-no-split="true"
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '0.3rem',
                        background: '#fff',
                        boxSizing: 'border-box',
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                      }}
                    >
                      <img
                        src={imagem.src}
                        alt={imagem.legenda || `Imagem ${imgIndex + 1} de ${nomeItem}`}
                        style={{
                          width: '100%',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                      <p
                        style={{
                          fontSize: '0.72rem',
                          color: '#4b5563',
                          marginTop: '0.25rem',
                          lineHeight: 1.2,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {imagem.legenda || `${nomeItem} - Imagem ${imgIndex + 1}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        data-pdf-no-split="true"
        data-pdf-page-break-before={temImagens ? 'true' : undefined}
        style={{
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontStyle: 'italic' }}>Autorizo a confecção deste material por cujo conteúdo me responsabilizo, ciente.</p>
          <p>Júlio Eduardo - Designer Gráfico</p>
          <p>📍 Rio Branco - AC | {dataAtual}</p>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#4b5563', border: 'none' }}>
          <p>1. As cores podem variar até 10% para mais claro ou mais escuro.</p>
          <p>2. Não garantimos fidelidade 100% das cores.</p>
          <p>3. Após aprovação, erros ortográficos serão responsabilidade do cliente.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: '3rem', marginTop: '5rem', marginBottom: '2.5rem' }}>
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
        <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.7rem', color: '#374151', fontSize: '12px', textAlign: 'center', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1.2rem', textTransform: 'uppercase' }}>
          <span>{rodape}</span>
        </div>
      </div>
    </div>
  );
};

export { PropostaComercial };