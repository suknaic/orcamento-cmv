import io from "./server";
import qrcode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";
import check from './check.svg';

class WhatsAppBot {
  private client: Client;

  constructor() {
    // Configuração do cliente WhatsApp Web
    this.client = new Client({
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

    this.initializeEvents();
  }

  private initializeEvents() {
    this.client.on("qr", (qr) => {
      qrcode.toDataURL(qr, (err, url) => {
        if (!err && url) {
          io.emit('qr', url);
          io.emit('message', '© QRCode recebido, aponte a câmera do seu celular!');
        }
      });
    });

    this.client.on("ready", () => {
      console.log("Cliente WhatsApp está pronto!");
      io.emit('connected');
    });
  }

  public initialize() {
    this.client.initialize();
    console.log("🤖 Bot do WhatsApp iniciado!");
  }

  public async getChatsIndividuais() {
    const chats = await this.client.getChats();
    return chats.filter(chat => !chat.isGroup);
  }

  public async sendMessage(numero: string, mensagem: string) {
    const jid = numero.endsWith("@c.us") ? numero : `${numero}@c.us`;
    return this.client.sendMessage(jid, mensagem);
  }
}

// Inicializa o bot
export const bot = new WhatsAppBot();
bot.initialize();
