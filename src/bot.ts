import io from "./server";
import qrcode from "qrcode";
import fs from "node:fs";
import puppeteer from "puppeteer";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";

type BotStatus = {
  connected: boolean;
  qr: string | null;
  message: string;
  state: string;
  updatedAt: string;
};

type ContactItem = {
  nome: string;
  numero: string;
  timestamp: number;
};

type GetContactsOptions = {
  limit?: number;
  query?: string;
};

type ContactsResult = {
  contatos: Array<{ nome: string; numero: string }>;
  total: number;
};

let isConnected = false;
let latestQrDataUrl: string | null = null;
let latestMessage = "© BOT-ORCAMENTO - Iniciado";
let lastState = "INITIALIZING";
let lastUpdatedAt = new Date().toISOString();

const CONTACTS_CACHE_TTL_MS = 45 * 1000;
let contactsCache: { expiresAt: number; contatos: ContactItem[] } | null = null;

function resolveChromeExecutablePath(): string | undefined {
  const fromEnv = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.GOOGLE_CHROME_BIN,
  ].filter(Boolean) as string[];

  const fromSystem = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ];

  const candidates = [...fromEnv];

  try {
    const bundled = puppeteer.executablePath();
    if (bundled) {
      candidates.push(bundled);
    }
  } catch {
    // Ignora erro se o Puppeteer não tiver browser baixado.
  }

  candidates.push(...fromSystem);

  return candidates.find((path) => !!path && fs.existsSync(path));
}

function logBrowserStartupHint(error: unknown) {
  const message = String(error || "");
  const hasLaunchError =
    message.includes("Failed to launch the browser process") || message.includes("Code: 127");

  if (!hasLaunchError) return;

  console.error("[WhatsApp] Falha ao iniciar o navegador (Code 127). Sugestoes:");
  console.error("1) Instale o browser do Puppeteer: bunx puppeteer browsers install chrome");
  console.error("2) Ou defina PUPPETEER_EXECUTABLE_PATH com o caminho do Chrome/Chromium");
  console.error(
    "3) Em Linux, pode faltar dependencias do sistema (ex.: libnss3, libatk-bridge2.0-0, libgbm1, libasound2)"
  );
}

const executablePath = resolveChromeExecutablePath();

if (!executablePath) {
  console.warn(
    "[WhatsApp] Nenhum executavel Chrome/Chromium encontrado automaticamente. Tentando inicializar com configuracao padrao..."
  );
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "bot-orcamento" }),
  puppeteer: {
    headless: true,
    executablePath,
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

let initializeInProgress: Promise<void> | null = null;

function touchState() {
  lastUpdatedAt = new Date().toISOString();
}

function updateState(data: {
  connected?: boolean;
  qr?: string | null;
  message?: string;
  state?: string;
}) {
  if (typeof data.connected === "boolean") {
    isConnected = data.connected;
  }
  if (data.qr !== undefined) {
    latestQrDataUrl = data.qr;
  }
  if (typeof data.message === "string") {
    latestMessage = data.message;
  }
  if (typeof data.state === "string") {
    lastState = data.state;
  }
  touchState();
}

function emitStatus(target: { emit: (event: string, payload?: any) => void }) {
  target.emit("whatsapp-status", isConnected);
  if (!isConnected && latestQrDataUrl) {
    target.emit("qr", latestQrDataUrl);
  }
  if (latestMessage) {
    target.emit("message", latestMessage);
  }
}

async function safeInitialize(): Promise<void> {
  if (initializeInProgress) {
    return initializeInProgress;
  }

  initializeInProgress = client
    .initialize()
    .catch((error) => {
      console.error("Erro ao inicializar cliente WhatsApp:", error);
      logBrowserStartupHint(error);
    })
    .finally(() => {
      initializeInProgress = null;
    });

  return initializeInProgress;
}

async function reconnectClient(): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await client.destroy();
    } catch (destroyError) {
      console.error("Erro ao destruir cliente durante reconexao:", destroyError);
    }

    await safeInitialize();
    return { success: true };
  } catch (error) {
    console.error("Erro ao reconectar cliente WhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function normalizeNumber(numero: string): string {
  let formattedNumber = numero.replace(/\D/g, "");
  if (!formattedNumber.endsWith("@c.us")) {
    formattedNumber = formattedNumber + "@c.us";
  }
  return formattedNumber;
}

client.on("qr", async (qr) => {
  console.log("QR RECEIVED");
  updateState({
    connected: false,
    state: "QR_RECEIVED",
    message: "© BOT-ORCAMENTO QRCode recebido, aponte a camera seu celular!",
  });

  io.emit("whatsapp-status", false);

  try {
    const dataUrl = await qrcode.toDataURL(qr);
    updateState({ qr: dataUrl });
    io.emit("qr", dataUrl);
  } catch (error) {
    console.error("Erro ao gerar QR em dataURL:", error);
    updateState({ message: "© BOT-ORCAMENTO erro ao gerar QRCode." });
  }

  io.emit("message", latestMessage);
});

client.on("ready", () => {
  console.log("© BOT-ORCAMENTO Dispositivo pronto");
  updateState({
    connected: true,
    qr: null,
    state: "READY",
    message: "© BOT-ORCAMENTO Dispositivo pronto!",
  });

  io.emit("whatsapp-status", true);
  io.emit("ready", "© BOT-ORCAMENTO Dispositivo pronto!");
  io.emit("message", latestMessage);
});

client.on("authenticated", () => {
  console.log("© BOT-ORCAMENTO Autenticado");
  updateState({
    connected: true,
    qr: null,
    state: "AUTHENTICATED",
    message: "© BOT-ORCAMENTO Autenticado!",
  });

  io.emit("whatsapp-status", true);
  io.emit("authenticated", "© BOT-ORCAMENTO Autenticado!");
  io.emit("message", latestMessage);
});

client.on("auth_failure", (msg) => {
  console.error("© BOT-ORCAMENTO Falha na autenticacao");
  updateState({
    connected: false,
    state: "AUTH_FAILURE",
    message:
      "© BOT-ORCAMENTO Falha na autenticacao, reiniciando..." +
      (msg ? " Motivo: " + String(msg) : ""),
  });

  io.emit("whatsapp-status", false);
  io.emit("message", latestMessage);
});

client.on("change_state", (state) => {
  console.log("© BOT-ORCAMENTO Status de conexao: ", state);
  updateState({ state: String(state) });
});

client.on("disconnected", (reason) => {
  console.log("© BOT-ORCAMENTO Cliente desconectado", reason);
  updateState({
    connected: false,
    state: "DISCONNECTED",
    message:
      "© BOT-ORCAMENTO Cliente desconectado!" +
      (reason ? " Motivo: " + String(reason) : ""),
  });

  io.emit("whatsapp-status", false);
  io.emit("message", latestMessage);

  safeInitialize().catch((error) => {
    console.error("Erro ao tentar reinicializar apos desconexao:", error);
  });
});

safeInitialize().catch((error) => {
  console.error("Erro na inicializacao inicial do cliente:", error);
});

io.on("connection", function (socket) {
  socket.emit("message", "© BOT-ORCAMENTO - Iniciado");
  emitStatus(socket);

  socket.on("get-whatsapp-status", () => {
    console.log("Cliente solicitou status atual do WhatsApp");
    emitStatus(socket);
  });

  socket.on("reconnect-bot", async () => {
    console.log("Solicitacao de reconexao recebida via socket");
    await reconnectClient();
    emitStatus(socket);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

async function getChats() {
  if (!client.info || !client.info.wid) return [];
  const chats = await client.getChats();
  return chats.filter((chat) => !chat.isGroup);
}

async function getBotStatus(): Promise<BotStatus> {
  return {
    connected: isConnected,
    qr: latestQrDataUrl,
    message: latestMessage,
    state: lastState,
    updatedAt: lastUpdatedAt,
  };
}

function buildContactsFromChats(chats: any[]): ContactItem[] {
  const map = new Map<string, ContactItem>();

  for (const chat of chats) {
    if (chat?.isGroup) continue;

    const numero = chat?.id?.user ? String(chat.id.user) : "";
    if (!numero) continue;

    const nome = (chat?.name && String(chat.name).trim()) || numero;
    const timestamp =
      typeof chat?.timestamp === "number" ? Number(chat.timestamp) : 0;

    const existing = map.get(numero);
    if (!existing) {
      map.set(numero, { nome, numero, timestamp });
      continue;
    }

    if (timestamp > existing.timestamp) {
      map.set(numero, { nome: nome || existing.nome, numero, timestamp });
      continue;
    }

    if (existing.nome === existing.numero && nome && nome !== numero) {
      map.set(numero, { nome, numero, timestamp: existing.timestamp });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
}

async function buildContactsFromDirectContacts(): Promise<ContactItem[]> {
  const rawContacts = await client.getContacts();
  const map = new Map<string, ContactItem>();

  for (const contact of rawContacts as any[]) {
    const numero = contact?.id?.user ? String(contact.id.user) : "";
    if (!numero) continue;

    const isSaved =
      typeof contact?.isMyContact === "boolean" ? contact.isMyContact : true;
    const isBusiness = typeof contact?.isBusiness === "boolean" ? contact.isBusiness : false;

    if (!isSaved && !isBusiness) continue;

    const nomeRaw = contact?.pushname ?? contact?.name ?? contact?.shortName ?? numero;
    const nome = String(nomeRaw).trim();

    if (!map.has(numero)) {
      map.set(numero, { nome: nome || numero, numero, timestamp: 0 });
    }
  }

  return Array.from(map.values());
}

async function buildContactsCache(): Promise<ContactItem[]> {
  if (!client.info || !client.info.wid) {
    contactsCache = {
      expiresAt: Date.now() + CONTACTS_CACHE_TTL_MS,
      contatos: [],
    };
    return [];
  }

  let contatos: ContactItem[] = [];

  try {
    const chats = await client.getChats();
    contatos = buildContactsFromChats(chats as any[]);
  } catch (error) {
    console.error("Erro ao listar chats no WhatsApp, tentando fallback via contatos:", error);
    contatos = await buildContactsFromDirectContacts();
  }

  contactsCache = {
    expiresAt: Date.now() + CONTACTS_CACHE_TTL_MS,
    contatos,
  };

  return contatos;
}

async function getContacts(options: GetContactsOptions = {}): Promise<ContactsResult> {
  const limit = typeof options.limit === "number" && options.limit >= 0 ? options.limit : 300;
  const query = (options.query || "").trim().toLowerCase();

  const contatosBase = contactsCache && contactsCache.expiresAt > Date.now()
    ? contactsCache.contatos
    : await buildContactsCache();

  const filtrados = query
    ? contatosBase.filter((item) => item.nome.toLowerCase().includes(query) || item.numero.toLowerCase().includes(query))
    : contatosBase;

  const contatos = filtrados.slice(0, limit).map((item) => ({
    nome: item.nome,
    numero: item.numero,
  }));

  return {
    contatos,
    total: filtrados.length,
  };
}

async function sendOrcamento(numero: string, mensagem: string) {
  try {
    const formattedNumber = normalizeNumber(numero);
    const chat = await client.getChatById(formattedNumber);
    await chat.sendMessage(mensagem);

    return true;
  } catch (error) {
    console.error("Erro ao enviar orcamento para " + numero + ":", error);
    throw new Error(
      "Falha ao enviar mensagem: " +
      (error instanceof Error ? error.message : "Erro desconhecido")
    );
  }
}

async function sendPDF(numero: string, pdfBuffer: Buffer, fileName: string) {
  if (!client) {
    throw new Error("Cliente WhatsApp nao inicializado");
  }

  try {
    const formattedNumber = normalizeNumber(numero);
    const media = new MessageMedia(
      "application/pdf",
      pdfBuffer.toString("base64"),
      fileName
    );

    const chat = await client.getChatById(formattedNumber);
    await chat.sendMessage(media, { caption: "Orcamento em formato PDF" });

    return true;
  } catch (error) {
    console.error("Erro ao enviar PDF para " + numero + ":", error);
    throw new Error(
      "Falha ao enviar PDF: " +
      (error instanceof Error ? error.message : "Erro desconhecido")
    );
  }
}

const bot = {
  async isConnected(): Promise<boolean> {
    return isConnected;
  },
  async getConnectionStatus(): Promise<BotStatus> {
    return getBotStatus();
  },
  async reconnect(): Promise<{ success: boolean; error?: string }> {
    return reconnectClient();
  },
};

export {
  getChats,
  sendOrcamento,
  sendPDF,
  isConnected,
  getBotStatus,
  getContacts,
  bot,
};
