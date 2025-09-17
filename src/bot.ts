import io from "./server";
import qrcode from "qrcode";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";

class WhatsAppBot {
  private client: Client;
  private ready: boolean = false;
  private ultimoQRCodeGerado: string | null = null;

  constructor() {
    this.client = this.createClient();
    this.setupEventListeners();
  }

  private createClient() {
    return new Client({
      authStrategy: new LocalAuth({ clientId: "bot-orcamento" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
    });
  }

  private setupEventListeners() {
    // Configuração de eventos de socket.io quando um cliente se conectar
    io.on("connection", (socket) => {
      console.log("Nova conexão de socket estabelecida");
      
      // Emitimos a mensagem inicial e ícone para cada nova conexão
      socket.emit('message', '© BOT-Orçamento - Iniciado');
      
      // Eventos do cliente WhatsApp
      this.client.on("qr", (qr) => {
        console.log('QR RECEIVED', qr.substring(0, 20) + '...');
        qrcode.toDataURL(qr, (err, url) => {
          if (!err && url) {
            this.ultimoQRCodeGerado = url;
            io.emit('qr', url);
            io.emit('message', '© BOT-Orçamento QRCode recebido, aponte a câmera seu celular!');
          }
        });
      });
  
      this.client.on("ready", () => {
        this.ready = true;
        console.log('© BOT-Orçamento Dispositivo pronto');
        io.emit('ready', '© BOT-Orçamento Dispositivo pronto!');
        io.emit('message', '© BOT-Orçamento Dispositivo pronto!');
        io.emit('qr', './check.svg');
        io.emit('connected');
      });
  
      this.client.on('authenticated', () => {
        io.emit('authenticated', '© BOT-Orçamento Autenticado!');
        io.emit('message', '© BOT-Orçamento Autenticado!');
        console.log('© BOT-Orçamento Autenticado');
      });
      
      this.client.on("disconnected", (reason) => {
        this.ready = false;
        io.emit('message', '© BOT-Orçamento Cliente desconectado!');
        console.log('© BOT-Orçamento Cliente desconectado', reason);
        // No exemplo, o cliente é reinicializado automaticamente após desconexão
        this.client.initialize();
      });
  
      this.client.on('auth_failure', () => {
        io.emit('message', '© BOT-Orçamento Falha na autenticação, reiniciando...');
        console.error('© BOT-Orçamento Falha na autenticação');
      });
  
      this.client.on('change_state', state => {
        console.log('© BOT-Orçamento Status de conexão: ', state);
      });
    });
  }

  public async initialize() {
    try {
      this.ready = false;
      io.emit('message', '© BOT-Orçamento Inicializando...');
      console.log("© BOT-Orçamento Inicializando...");
      await this.client.initialize();
      console.log("© BOT-Orçamento Inicializado");
      // O evento 'ready' será disparado automaticamente após a inicialização, se tudo der certo
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao inicializar:", error);
      io.emit('message', '© BOT-Orçamento Erro ao inicializar. Tente reconectar.');
    }
  }

  public async isConnected() {
    return this.ready;
  }

  public async getChatsIndividuais() {
    if (!this.ready) return [];
    try {
      const chats = await this.client.getChats();
      return chats.filter(chat => !chat.isGroup);
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao obter chats:", error);
      return [];
    }
  }

  public async sendOrcamento(numero: string, mensagem: string) {
    if (!this.ready) throw new Error("© BOT-Orçamento Não está conectado");
    
    // Formatação do número seguindo o padrão do exemplo.js
    let jid = "";
    const numberDDI = numero.substr(0, 2);
    
    if (numberDDI !== "55") {
      jid = numero + "@c.us";
    } else {
      // Para números brasileiros, segue o padrão do exemplo.js
      const numberDDD = numero.substr(2, 2);
      const numberUser = numero.substr(-8, 8);
      
      if (parseInt(numberDDD) <= 30) {
        jid = "55" + numberDDD + "9" + numberUser + "@c.us";
      } else {
        jid = "55" + numberDDD + numberUser + "@c.us";
      }
    }
    
    return this.client.sendMessage(jid, mensagem);
  }

  public async sendOrcamentoPDF(numero: string, mensagem: string, file: { mimetype: string, data: string, filename: string }) {
    if (!this.ready) throw new Error("© BOT-Orçamento Não está conectado");
    
    // Formatação do número seguindo o padrão do exemplo.js
    let jid = "";
    const numberDDI = numero.substr(0, 2);
    
    if (numberDDI !== "55") {
      jid = numero + "@c.us";
    } else {
      // Para números brasileiros, segue o padrão do exemplo.js
      const numberDDD = numero.substr(2, 2);
      const numberUser = numero.substr(-8, 8);
      
      if (parseInt(numberDDD) <= 30) {
        jid = "55" + numberDDD + "9" + numberUser + "@c.us";
      } else {
        jid = "55" + numberDDD + numberUser + "@c.us";
      }
    }
    
    const { mimetype, data, filename } = file;
    const media = new MessageMedia(mimetype, data, filename);
    return this.client.sendMessage(jid, media, { caption: mensagem });
  }

  public async disconnect() {
    console.log("© BOT-Orçamento Desconectando...");
    this.ready = false;
    io.emit('message', '© BOT-Orçamento Desconectando...');
    
    try {
      await this.client.destroy();
      io.emit('message', '© BOT-Orçamento Desconectado com sucesso!');
      console.log("© BOT-Orçamento Desconectado com sucesso");
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao desconectar:", error);
      io.emit('message', '© BOT-Orçamento Erro ao desconectar');
    }
  }

  public async reconnect() {
    console.log("© BOT-Orçamento Reconectando...");
    io.emit('message', '© BOT-Orçamento Reconectando...');
    
    try {
      await this.disconnect();
      // Recria o cliente
      this.client = this.createClient();
      // Reconfigura os event listeners
      this.setupEventListeners();
      // Inicializa novamente
      await this.initialize();
      return { success: true };
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao reconectar:", error);
      io.emit('message', '© BOT-Orçamento Erro ao reconectar');
      return { success: false, error };
    }
  }
}

// Inicializa o bot
export const bot = new WhatsAppBot();
bot.initialize();
