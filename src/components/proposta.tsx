import Header from '../topo-proposta.png';

const PropostaComercial = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white border rounded-lg shadow-lg text-gray-800">
      {/* Header da proposta */}
      <div className="flex justify-center mb-6">
        <img src={Header} alt="Header Proposta" className="w-full object-contain" />
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-red-700">ALERTA CIDADE</h2>
        <p><strong>Cliente:</strong> Manoel Roque</p>
        <p><strong>Designer:</strong> Júlio Eduardo | 📞 (68) 99976-0124</p>
      </div>

      <div className="mb-4">
        <p><strong>Validade da proposta:</strong> 20 dias</p>
        <p><strong>Prazo de entrega:</strong> 2 dias</p>
        <p><strong>Pagamento:</strong> À vista</p>
      </div>

      <table className="w-full border border-gray-300 mb-4">
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
          <tr>
            <td className="border px-3 py-2">01</td>
            <td className="border px-3 py-2">Fachada em ACM de 18m com letras em PVC e lateral adesivado</td>
            <td className="border px-3 py-2">1</td>
            <td className="border px-3 py-2">R$ 10.000,00</td>
            <td className="border px-3 py-2">R$ 10.000,00</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td className="border px-3 py-2" colSpan={4}>Total com Descontos</td>
            <td className="border px-3 py-2 font-bold">R$ 10.000,00</td>
          </tr>
        </tfoot>
      </table>

      <div className="mb-4">
        <p className="italic">Autorizo a confecção deste material por cujo conteúdo me responsabilizo, ciente.</p>
        <p><strong>Assinatura:</strong> Júlio Eduardo - Designer Gráfico</p>
        <p>📍 Rio Branco - AC | 17 de Agosto de 2025</p>
      </div>

      <div className="text-sm text-gray-600">
        <p>1. As cores podem variar até 10% para mais claro ou mais escuro.</p>
        <p>2. Não garantimos fidelidade 100% das cores.</p>
        <p>3. Após aprovação, erros ortográficos serão responsabilidade do cliente.</p>
      </div>

      <div className="flex flex-col items-center mt-8">
        <div className="w-[500px] border-b-2 border-gray-400 mb-2"></div>
        <span className="text-gray-700 text-sm">Assinatura do Cliente</span>
      </div>
    </div>
  );
};

export { PropostaComercial };