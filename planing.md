MOdelagem do Materiais
const materiais = {
"Fachada em ACM": { tipo: "m2", precoM2: 250 },
"Fachada em lona": { tipo: "m2", precoM2: 120 },
"Quadro de lona": { tipo: "unidade", precoUnidade: 80 },
"Adesivo vinil": { tipo: "m2", precoM2: 75 },
"Caneca personalizada": { tipo: "unidade", precoUnidade: 25 },
"Cartão de visita": { tipo: "milheiro", precoMilheiro: 60 },
"Faixa de moto": { tipo: "kit", precoKit: 35 },
"Envelopamento de geladeira": { tipo: "unidade", precoUnidade: 180 },
"Acrílico com corte": { tipo: "m2", precoM2: 300 }
};

calculo dos orcamento

const calcularOrcamento = (material, largura, altura, quantidade) => {
const item = materiais[material];
if (!item) return 0;

if (item.tipo === "m2") {
const area = (largura _ altura).toFixed(2);
return area _ item.precoM2;
}

if (item.tipo === "unidade") {
return item.precoUnidade \* quantidade;
}

if (item.tipo === "milheiro") {
return item.precoMilheiro \* (quantidade / 1000);
}

if (item.tipo === "kit") {
return item.precoKit \* quantidade;
}

return 0;
};

interface dinamica
[] botao copiar para area de transferencia
[] botao enviar para whatsapp com modal onde abre lista de contatos
[] enviar pdf para whastapp com modal onde abre lista de contato

mensagem para area de transferia e botao enviar para whatsapp
Orçamento: Fachada em ACM (3x1m)  
Valor estimado: R$750,00  
Validade: 7 dias  
Prazo de produção: 5 dias úteis
