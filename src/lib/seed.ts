import { criarOrcamento, listarOrcamentos } from './orcamentoCrud';

// Dados iniciais para popular o banco de dados
const seeds = [
  { nome: 'Fachada em ACM', tipo: 'm2', preco: 250 },
  { nome: 'Fachada em lona', tipo: 'm2', preco: 120 },
  { nome: 'Quadro de lona', tipo: 'unidade', preco: 80 },
  { nome: 'Adesivo vinil', tipo: 'm2', preco: 75 },
  { nome: 'Caneca personalizada', tipo: 'unidade', preco: 25 },
  { nome: 'Cartão de visita', tipo: 'milheiro', preco: 60 },
  { nome: 'Faixa de moto', tipo: 'kit', preco: 35 },
  { nome: 'Envelopamento de geladeira', tipo: 'unidade', preco: 180 },
  { nome: 'Acrílico com corte', tipo: 'm2', preco: 300 },
];

function seedDB() {
  const existentes = listarOrcamentos();
  if (existentes.length > 0) {
    console.log('Banco de dados já possui dados.');
    return;
  }
  for (const item of seeds) {
    criarOrcamento(item.nome, item.preco, item.tipo);
  }
  console.log('Banco de dados populado com dados iniciais!');
}

seedDB();
