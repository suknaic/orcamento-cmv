import Header from '../topo-proposta.png';

interface PropostaComercialProps {
  cliente?: string;
  validade?: string;
  desconto?: string;
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
  desconto = '',
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
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-800" style={{background: '#fff'}}>
      {/* Header da proposta */}
      <div className="flex justify-center mb-6">
        <img src={Header} alt="Header Proposta" className="w-full object-contain" />
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-red-700">ALERTA CIDADE</h2>
        <p><strong>Cliente:</strong> {cliente}</p>
        <p><strong>Designer:</strong> Júlio Eduardo | 📞 (68) 99976-0124</p>
      </div>
      <div className="mb-4">
        <p><strong>Validade da proposta:</strong> {validade}</p>
        <p><strong>Prazo de entrega:</strong> 2 dias</p>
        <p><strong>Pagamento:</strong> {pagamento}</p>
        {desconto && <p><strong>Desconto:</strong> {desconto}</p>}
      </div>

      <table className="w-full border  mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 text-left">#</th>
            <th className="border px-3 py-2 text-left">Descrição</th>
            <th className="border px-3 py-2 text-left">Qtd</th>
            <th className="border px-3 py-2 text-left">Valor Unitário</th>
            <th className="border px-3 py-2 text-left">Total</th>
          </tr>
        </thead>
        <tbody>
          {orcamento.map((item, idx) => (
            <tr key={idx}>
              <td className="border px-3 py-2">{String(idx + 1).padStart(2, '0')}</td>
              <td className="border px-3 py-2">{item.descricao}</td>
              <td className="border px-3 py-2">{item.quantidade}</td>
              <td className="border px-3 py-2">R$ {item.valorUnitario.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
              <td className="border px-3 py-2">R$ {item.total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td className="border px-3 py-2" colSpan={4}>Total com Descontos</td>
            <td className="border px-3 py-2 font-bold">R$ {total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mb-4">
        <p className="italic">Autorizo a confecção deste material por cujo conteúdo me responsabilizo, ciente.</p>
        <p><strong>Assinatura:</strong> Júlio Eduardo - Designer Gráfico</p>
        <p>📍 Rio Branco - AC | 17 de Agosto de 2025</p>
      </div>

      <div className="text-sm text-gray-600 border-none">
        <p>1. As cores podem variar até 10% para mais claro ou mais escuro.</p>
        <p>2. Não garantimos fidelidade 100% das cores.</p>
        <p>3. Após aprovação, erros ortográficos serão responsabilidade do cliente.</p>
      </div>

      <div className="flex flex-row items-end justify-center gap-12 mt-12 mb-40">
        <div className="flex flex-col items-center">
          <div className="w-[220px] border-b-2 border-gray-400 mb-2"></div>
          <span className="text-gray-700 text-sm">Assinatura do Cliente</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[220px] border-b-2 border-gray-400 mb-2"></div>
          <span className="text-gray-700 text-sm">Assinatura do Júlio</span>
        </div>
      </div>
    </div>
  );
};

export { PropostaComercial };