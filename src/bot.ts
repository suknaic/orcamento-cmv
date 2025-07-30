import io from "./server";
import qrcode from "qrcode";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";


class WhatsAppBot {
  private client: Client;
  private ready: boolean = false;

  constructor() {
    this.client = this.createClient();
    this.initializeEvents();
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

  private initializeEvents() {
    this.client.on("qr", (qr) => {
      qrcode.toDataURL(qr, (err, url) => {
        if (!err && url) {
          io.emit('qr', url);
          io.emit('message', '🎉 QRCode gerado! Aponte a câmera do seu celular ');
          console.log("🔑 QRCode gerado! Escaneie para conectar-se ao WhatsApp!");
        }
      });
    });

    this.client.on("ready", () => {
      this.ready = true;
      console.log("✅ Cliente WhatsApp está pronto");
      io.emit('connected');
    });

    this.client.on("disconnected", () => {
      this.ready = false;
      console.log("⚠️ Bot desconectado do WhatsApp");
    });
  }

  public async initialize() {
    this.ready = false;
    await this.client.initialize();
    // O evento 'qr' será emitido automaticamente pelo client após initialize se necessário
    io.emit('message', '⏳ Iniciando o bot do WhatsApp...');
    console.log("🤖 Bot do WhatsApp iniciado");
  }

  public async isConnected() {
    return this.ready;
  }

  public async getChatsIndividuais() {
    if (!this.client.info || !this.client.info.wid) return [];
    const chats = await this.client.getChats();
    return chats.filter(chat => !chat.isGroup);
  }

  public async sendOrcamento(numero: string, mensagem: string) {
    const jid = numero.endsWith("@c.us") ? numero : `${numero}@c.us`;
    return this.client.sendMessage(jid, mensagem);
  }

  public async sendOrcamentoPDF(numero: string, mensagem: string, file: { mimetype: string, data: string, filename: string }) {
    const jid = numero.endsWith("@c.us") ? numero : `${numero}@c.us`;
    const { mimetype, data, filename } = file;
    const media = new MessageMedia(mimetype, data, filename);
    return this.client.sendMessage(jid, media, { caption: mensagem });
  }

  public async disconnect() {
    console.log("👋 Desconectando o bot do WhatsApp...");
    this.ready = false;
    await this.client.destroy();
    this.initializeEvents();
  }
}

// Inicializa o bot
export const bot = new WhatsAppBot();
bot.initialize();
