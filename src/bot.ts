import io from "./server";
import qrcode from "qrcode";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";

// Variável para controlar o estado de conexão
let isConnected = false;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-orcamento' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// Event listeners
client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  isConnected = false;
  
  // Emitir o estado de conexão (falso quando recebendo QR)
  io.emit('whatsapp-status', false);
  
  // Gera QR code para exibição
  qrcode.toDataURL(qr, (err, url) => {
    // Emitir para todos os clientes conectados
    io.emit('qr', url);
    io.emit('message', '© BOT-ORCAMENTO QRCode recebido, aponte a câmera seu celular!');
  });
});

client.on('ready', () => {
  console.log('© BOT-ORCAMENTO Dispositivo pronto');
  isConnected = true;
  
  // Emitir o estado de conexão (verdadeiro quando pronto)
  io.emit('whatsapp-status', true);
  
  io.emit('ready', '© BOT-ORCAMENTO Dispositivo pronto!');
  io.emit('message', '© BOT-ORCAMENTO Dispositivo pronto!');
});

client.on('authenticated', () => {
  console.log('© BOT-ORCAMENTO Autenticado');
  isConnected = true;
  
  // Emitir o estado de conexão
  io.emit('whatsapp-status', true);
  
  io.emit('authenticated', '© BOT-ORCAMENTO Autenticado!');
  io.emit('message', '© BOT-ORCAMENTO Autenticado!');
});

client.on('auth_failure', function () {
  console.error('© BOT-ORCAMENTO Falha na autenticação');
  isConnected = false;
  
  // Emitir o estado de conexão
  io.emit('whatsapp-status', false);
  
  io.emit('message', '© BOT-ORCAMENTO Falha na autenticação, reiniciando...');
});

client.on('change_state', state => {
  console.log('© BOT-ORCAMENTO Status de conexão: ', state);
});

client.on('disconnected', (reason) => {
  isConnected = false;
  
  // Emitir o estado de conexão
  io.emit('whatsapp-status', false);
  
  io.emit('message', '© BOT-ORCAMENTO Cliente desconectado!');
  console.log('© BOT-ORCAMENTO Cliente desconectado', reason);
  client.initialize();
});

client.initialize();

io.on('connection', function (socket) {
  socket.emit('message', '© BOT-ORCAMENTO - Iniciado');
  
  // Enviar o estado atual para o cliente que acabou de se conectar
  socket.emit('whatsapp-status', isConnected);

  // Adicionando handler para o evento get-whatsapp-status
  socket.on('get-whatsapp-status', () => {
    console.log('Cliente solicitou status atual do WhatsApp');
    socket.emit('whatsapp-status', isConnected);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});


async function getChats() {
  if (!client.info || !client.info.wid) return [];
  const chats = await client.getChats();
  return chats.filter(chat => !chat.isGroup);
}

async function sendOrcamento(numero: string, mensagem: string) {
  try {
    // Formata o número para o padrão esperado pelo WhatsApp Web.js
    // Certifique-se de que o número esteja no formato correto: [código do país][DDD][número]
    // Ex: 5521999999999
    let formattedNumber = numero.replace(/\D/g, '');
    
    // Adiciona "@c.us" ao final, que é o formato esperado pelo WhatsApp Web.js
    if (!formattedNumber.endsWith('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    // Verifica se o chat existe
    const chat = await client.getChatById(formattedNumber);
    
    // Envia a mensagem
    await chat.sendMessage(mensagem);
    
    return true;
  } catch (error) {
    console.error(`Erro ao enviar orçamento para ${numero}:`, error);
    throw new Error(`Falha ao enviar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Envia PDF como arquivo
async function sendPDF(numero: string, pdfBuffer: Buffer, fileName: string) {
  if (!client) {
    throw new Error('Cliente WhatsApp não inicializado');
  }

  try {
    let formattedNumber = numero.replace(/\D/g, '');
    if (!formattedNumber.endsWith('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    // Cria um objeto MessageMedia com o buffer do PDF
    const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), fileName);
    
    // Obtém o chat e envia o arquivo
    const chat = await client.getChatById(formattedNumber);
    await chat.sendMessage(media, { caption: 'Orçamento em formato PDF' });
    
    return true;
  } catch (error) {
    console.error(`Erro ao enviar PDF para ${numero}:`, error);
    throw new Error(`Falha ao enviar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export { getChats, sendOrcamento, sendPDF, isConnected };
