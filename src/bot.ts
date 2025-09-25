import io from "./server";
import { create, Whatsapp, SocketState } from "venom-bot";
import type { Message } from "venom-bot";
import fs from "fs";
import path from "path";

class WhatsAppBot {
  private client: Whatsapp | null = null;
  private ready: boolean = false;
  private ultimoQRCodeGerado: string | null = null;
  private sessionName: string = "bot-orcamento";
  private isInitializing: boolean = false;

  constructor() {
    this.setupSocketListeners();
    // Não inicializamos no construtor para evitar inicializações indesejadas
    // Isso será feito pelo sistema quando necessário
  }

  private setupSocketListeners() {
    // Configuração de eventos de socket.io quando um cliente se conectar
    io.on("connection", (socket) => {
      console.log("Nova conexão de socket estabelecida");

      // Emitimos a mensagem inicial para cada nova conexão
      socket.emit("message", "© BOT-Orçamento - Iniciado");

      // Verificamos o estado atual e enviamos as informações corretas
      this.sendCurrentState(socket);
    });
  }

  /**
   * Envia o estado atual do bot para um socket específico ou para todos
   */
  private async sendCurrentState(socket?: any) {
    const target = socket || io;

    // Verificação mais precisa de conexão usando os métodos oficiais do Venom-bot
    if (this.client) {
      try {
        // Usa os novos métodos para verificação de estado
        const isConnected = await this.isConnected();
        const connectionStatus = await this.getConnectionStatus();
        
        if (isConnected) {
          // Dispositivo realmente conectado confirmado pelos métodos do Venom-bot
          target.emit("qr", "./check.svg");
          target.emit("ready", "© BOT-Orçamento Dispositivo pronto!");
          target.emit("connected");
          target.emit("authenticated", "© BOT-Orçamento Autenticado!");
          target.emit("message", "© BOT-Orçamento Dispositivo conectado e verificado");
          target.emit("connection-status", connectionStatus);
        } else if (this.ready) {
          // O cliente existe e está marcado como ready, mas a verificação de API falhou
          target.emit("qr", "./icon.svg");
          target.emit("message", `© BOT-Orçamento Problema de conexão detectado: ${(connectionStatus as any).state}`);
          target.emit("connection-status", connectionStatus);
        } else if (this.ultimoQRCodeGerado && this.isInitializing) {
          // Está inicializando e tem um QR code, enviamos o QR
          target.emit("qr", this.ultimoQRCodeGerado);
          target.emit(
            "message",
            "© BOT-Orçamento QRCode recebido, aponte a câmera seu celular!"
          );
          target.emit("connection-status", { 
            state: "WAITING_FOR_QR_SCAN",
            initializing: true,
            hasQR: true,
            connected: false,
            clientExists: true,
            readyState: false,
            message: "Aguardando leitura do QR Code"
          });
        } else if (this.isInitializing) {
          // Está inicializando mas ainda não tem QR code
          target.emit("qr", "./icon.svg");
          target.emit(
            "message",
            "© BOT-Orçamento Inicializando, aguarde o QRCode..."
          );
          target.emit("connection-status", { 
            state: "INITIALIZING",
            initializing: true,
            hasQR: false,
            connected: false,
            clientExists: true,
            readyState: false,
            message: "Inicializando, aguardando QR Code"
          });
        }
      } catch (error) {
        console.error("© BOT-Orçamento Erro ao verificar estado:", error);
        target.emit("qr", "./icon.svg");
        target.emit("message", "© BOT-Orçamento Erro ao verificar estado da conexão");
        target.emit("connection-status", { 
          state: "ERROR",
          error: String(error),
          connected: false,
          clientExists: !!this.client,
          readyState: false,
          message: "Erro ao verificar estado da conexão"
        });
      }
    } else {
      // Não está inicializado nem conectado
      target.emit("qr", "./icon.svg");
      target.emit("message", "© BOT-Orçamento Não inicializado");
      target.emit("connection-status", { 
        state: "NOT_INITIALIZED",
        clientExists: false,
        connected: false,
        readyState: false,
        message: "Bot não inicializado"
      });
    }
  }

  private setupClientEvents(client: Whatsapp) {
    // Configurando os eventos do cliente
    client.onStateChange((state) => {
      console.log("© BOT-Orçamento Status de conexão:", state);

      if (state === SocketState.CONNECTED) {
        this.ready = true;
        this.isInitializing = false;
        io.emit("ready", "© BOT-Orçamento Dispositivo pronto!");
        io.emit("message", "© BOT-Orçamento Dispositivo pronto!");
        io.emit("qr", "./check.svg");
        io.emit("connected");
        io.emit("authenticated", "© BOT-Orçamento Autenticado!");
      }

      if (
        state === SocketState.UNPAIRED ||
        state === SocketState.UNPAIRED_IDLE ||
        state === SocketState.DISCONNECTED
      ) {
        this.ready = false;
        io.emit("message", "© BOT-Orçamento Cliente desconectado!");
      }
    });

    // Configurar handler de mensagens
    client.onMessage(async (message) => {
      // Ignora mensagens de grupos
      if (message.isGroupMsg) return;

      // Ignora mensagens vazias
      if (!message.body || message.body === "") return;

      // Exemplo de resposta automática que pode ser personalizada
      if (message.body.toLowerCase() === "orcamento") {
        await client.sendText(
          message.from,
          "Olá! Para solicitar um orçamento, por favor informe as dimensões do seu projeto."
        );
      }

      // Log de mensagens recebidas
      console.log(`Mensagem recebida de ${message.from}: ${message.body}`);
    });
  }

  /**
   * Verifica se a sessão anterior existe e a remove para evitar problemas
   */
  private async limparSessaoAnterior() {
    const tokenPath = path.join(process.cwd(), "tokens", this.sessionName);

    if (fs.existsSync(tokenPath)) {
      try {
        // Em vez de remover completamente, vamos manter a estrutura mas remover arquivos específicos
        // que podem causar problemas na reconexão
        const arquivosParaRemover = [
          "session.json",
          "session-name.json",
          "tokens-*.json",
        ];

        for (const pattern of arquivosParaRemover) {
          const arquivos = fs
            .readdirSync(tokenPath)
            .filter((file) => file.match(pattern.replace("*", ".*")));

          for (const arquivo of arquivos) {
            const caminhoCompleto = path.join(tokenPath, arquivo);
            fs.unlinkSync(caminhoCompleto);
            console.log(`© BOT-Orçamento Arquivo removido: ${caminhoCompleto}`);
          }
        }

        console.log(`© BOT-Orçamento Sessão anterior limpa: ${tokenPath}`);
      } catch (error) {
        console.error(
          `© BOT-Orçamento Erro ao limpar sessão anterior: ${error}`
        );
      }
    }
  }

  /**
   * Inicializa o cliente WhatsApp
   * @param forceNew Se true, remove a sessão anterior e força uma nova conexão
   */
  public async initialize(forceNew: boolean = false) {
    // Evita inicializações simultâneas
    if (this.isInitializing) {
      console.log("© BOT-Orçamento Já está inicializando, aguarde...");
      io.emit("message", "© BOT-Orçamento Já está inicializando, aguarde...");
      return { success: false, message: "Já está inicializando" };
    }

    // Se já estiver conectado e não for forçar nova conexão, apenas retorna
    if (!forceNew && this.client) {
      // Verifica o status real da conexão usando os métodos oficiais
      const isConnected = await this.isConnected();
      if (isConnected) {
        console.log("© BOT-Orçamento Já está conectado e verificado");
        io.emit("message", "© BOT-Orçamento Já está conectado e verificado");
        this.sendCurrentState();
        return { success: true, message: "Já conectado" };
      } else if (this.ready) {
        console.log("© BOT-Orçamento Marcado como pronto, mas verificação de API falhou. Reconectando...");
        io.emit("message", "© BOT-Orçamento Problema de conexão detectado. Reconectando...");
        // Se estiver marcado como ready mas a verificação falhar, força reconexão
        forceNew = true;
      }
    }

    try {
      this.isInitializing = true;

      // Se o cliente já existir, tentamos fechá-lo primeiro
      if (this.client) {
        try {
          await this.client.close();
          this.client = null;
          console.log("© BOT-Orçamento Cliente anterior fechado");
          // Aguardamos um pouco antes de prosseguir
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err) {
          console.error(
            "© BOT-Orçamento Erro ao fechar cliente anterior:",
            err
          );
        }
      }

      this.ready = false;
      this.ultimoQRCodeGerado = null;

      io.emit("message", "© BOT-Orçamento Inicializando...");
      io.emit("qr", "./icon.svg"); // Inicializa com ícone padrão enquanto aguarda QR
      console.log("© BOT-Orçamento Inicializando...");

      // Se forçar nova conexão, limpa a sessão anterior
      if (forceNew) {
        await this.limparSessaoAnterior();
      }

      // Criando a sessão do Venom
      this.client = await create({
        session: this.sessionName,
        headless: "new",
        debug: false,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,
        autoClose: 0,
        createPathFileToken: true,
        catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
          console.log("QR RECEIVED", urlCode);
          this.ultimoQRCodeGerado = base64Qr;
          io.emit("qr", base64Qr);
          io.emit(
            "message",
            `© BOT-Orçamento QRCode recebido, aponte a câmera seu celular! (Tentativa: ${attempts})`
          );
        },
        statusFind: (statusSession, session) => {
          console.log("Status da sessão:", statusSession);

          if (statusSession === "qrReadSuccess") {
            io.emit("message", "© BOT-Orçamento QR Code lido com sucesso!");
          } else if (statusSession === "isLogged") {
            this.ready = true;
            this.isInitializing = false;
            io.emit("ready", "© BOT-Orçamento Dispositivo pronto!");
            io.emit("message", "© BOT-Orçamento Dispositivo pronto!");
            io.emit("qr", "./check.svg");
            io.emit("connected");
            io.emit("authenticated", "© BOT-Orçamento Autenticado!");
          } else if (statusSession === "browserClose") {
            this.ready = false;
            this.isInitializing = false;
            io.emit("message", "© BOT-Orçamento Navegador fechado!");
          } else if (statusSession === "qrReadFail") {
            io.emit("message", "© BOT-Orçamento Falha ao ler QR Code!");
          } else if (statusSession === "autocloseCalled") {
            this.ready = false;
            this.isInitializing = false;
            io.emit("message", "© BOT-Orçamento Fechado automaticamente!");
          } else if (statusSession === "serverClose") {
            this.ready = false;
            this.isInitializing = false;
            io.emit("message", "© BOT-Orçamento Servidor fechado!");
          }
        },
        browserArgs: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      });

      // Configurando eventos do cliente
      if (this.client) {
        this.setupClientEvents(this.client);
        
        // Verificação adicional após inicialização
        setTimeout(async () => {
          try {
            // Verifica se realmente está conectado após a inicialização
            const isConnected = await this.isConnected();
            const state = await this.client!.getConnectionState();
            console.log(`© BOT-Orçamento Verificação pós-inicialização: ${isConnected ? 'Conectado' : 'Desconectado'}, Estado: ${state}`);
            
            if (!isConnected && this.ready) {
              console.log("© BOT-Orçamento Inconsistência detectada: marcado como pronto mas não está conectado");
              io.emit("message", "© BOT-Orçamento Verificando consistência da conexão...");
            }
          } catch (err) {
            console.error("© BOT-Orçamento Erro na verificação pós-inicialização:", err);
          }
        }, 5000);  // Verifica após 5 segundos
      }

      console.log("© BOT-Orçamento Inicializado");
      return { success: true };
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao inicializar:", error);
      io.emit(
        "message",
        `© BOT-Orçamento Erro ao inicializar: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      this.isInitializing = false;
      return { success: false, error };
    }
  }

  /**
   * Verifica se o cliente WhatsApp está conectado usando métodos oficiais do Venom-bot
   * @returns {Promise<boolean>} true se conectado, false caso contrário
   */
  public async isConnected(): Promise<boolean> {
    // Verificação básica para garantir que a instância do cliente existe
    if (!this.client) {
      console.log("© BOT-Orçamento Cliente não inicializado");
      return false;
    }

    try {
      // Método oficial da API do Venom-bot para verificar conexão
      // https://www.npmjs.com/package/venom-bot
      const connected = await this.client.isConnected();
      
      // Verificação adicional usando o estado da conexão
      const state = await this.client.getConnectionState();
      
      console.log(`© BOT-Orçamento Status da conexão: ${state}, API isConnected: ${connected}`);
      
      // Considera conectado se o método isConnected() retornar true E o estado for CONNECTED
      return connected && state === SocketState.CONNECTED;
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao verificar conexão:", error);
      return false;
    }
  }
  
  /**
   * Obtém o estado detalhado da conexão do WhatsApp
   * @returns {Promise<object>} Objeto com informações detalhadas sobre o estado da conexão
   */
  public async getConnectionStatus(): Promise<object> {
    if (!this.client) {
      return {
        connected: false,
        state: "NO_CLIENT",
        clientExists: false,
        readyState: this.ready,
        message: "Cliente não inicializado"
      };
    }

    try {
      // Obtém informações detalhadas usando os métodos oficiais do Venom-bot
      const connectionState = await this.client.getConnectionState();
      const isConnectedAPI = await this.client.isConnected();
      
      return {
        connected: isConnectedAPI && connectionState === SocketState.CONNECTED,
        state: connectionState,
        clientExists: !!this.client,
        readyState: this.ready,
        apiConnected: isConnectedAPI,
        message: `Estado: ${connectionState}, API: ${isConnectedAPI ? "Conectado" : "Desconectado"}`
      };
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao obter status detalhado:", error);
      return {
        connected: false,
        state: "ERROR",
        clientExists: !!this.client,
        readyState: this.ready,
        error: String(error),
        message: "Erro ao verificar estado da conexão"
      };
    }
  }

  public async getChatsIndividuais(): Promise<any[]> {
    if (!(await this.isConnected()) || !this.client) {
      throw new Error("© BOT-Orçamento Não está conectado");
    }

    try {
      console.log("© BOT-Orçamento Obtendo chats individuais...");
      
      // Tentar o método principal primeiro
      let contatos = await this.obterContatosPorChats();
      
      // Se não encontrou contatos, tentar método alternativo
      if (contatos.length === 0) {
        console.log("© BOT-Orçamento Nenhum contato encontrado no método principal, tentando método alternativo...");
        contatos = await this.obterContatosPorMensagens();
      }
      
      // Se ainda não encontrou contatos, usar genérico
      if (contatos.length === 0) {
        console.log("© BOT-Orçamento Nenhum contato encontrado em ambos os métodos, usando contato genérico...");
        
        const contatoGenerico = [{
          id: '5511999999999@c.us',
          numero: '5511999999999',
          nome: 'Digite um número manualmente'
        }];
        
        return contatoGenerico;
      }
      
      console.log(`© BOT-Orçamento Total de contatos obtidos: ${contatos.length}`);
      return contatos;
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao obter chats individuais:", error);
      
      // Em caso de erro, tentar método alternativo
      try {
        console.log("© BOT-Orçamento Tentando método alternativo após erro...");
        const contatosAlternativos = await this.obterContatosPorMensagens();
        
        if (contatosAlternativos.length > 0) {
          return contatosAlternativos;
        }
      } catch (e) {
        console.error("© BOT-Orçamento Erro também no método alternativo:", e);
      }
      
      // Se tudo falhar, retornar contato genérico
      return [{
        id: '5511999999999@c.us',
        numero: '5511999999999',
        nome: 'Digite um número manualmente'
      }];
    }
  }
  
  /**
   * Método alternativo para obter contatos através das mensagens recentes
   * Útil quando o método principal falha
   */
  private async obterContatosPorMensagens(): Promise<any[]> {
    try {
      console.log("© BOT-Orçamento Tentando obter contatos por mensagens recentes...");
      
      // Tenta obter todos os chats novamente
      const allChats: any[] = await this.client!.getAllChats();
      
      // Filtrar chats que têm mensagens e são individuais
      const chatsComMensagens = allChats.filter((chat: any) => {
        try {
          return chat && 
                chat.id && 
                chat.id._serialized && 
                typeof chat.id._serialized === 'string' && 
                chat.id._serialized.includes('@c.us') && 
                !chat.isGroup;
        } catch (e) {
          return false;
        }
      });
      
      console.log(`© BOT-Orçamento Chats com mensagens encontrados: ${chatsComMensagens.length}`);
      
      if (chatsComMensagens.length === 0) {
        // Tentar método ainda mais alternativo - usar getAllContacts se disponível
        try {
          // @ts-ignore - Tenta usar método não tipado
          const contatos = await this.client!.getAllContacts();
          if (contatos && contatos.length > 0) {
            console.log(`© BOT-Orçamento Contatos obtidos via getAllContacts: ${contatos.length}`);
            
            return contatos
              .filter((contato: any) => {
                try {
                  return contato && 
                        contato.id && 
                        contato.id.user && 
                        !contato.isGroup;
                } catch (e) {
                  return false;
                }
              })
              .map((contato: any) => {
                try {
                  const id = `${contato.id.user}@c.us`;
                  const numero = contato.id.user;
                  const nome = contato.name || contato.pushname || `Contato ${numero}`;
                  return { id, numero, nome };
                } catch (e) {
                  return null;
                }
              })
              .filter(Boolean);
          }
        } catch (e) {
          console.log("© BOT-Orçamento getAllContacts não disponível ou falhou:", e);
        }
        
        return [];
      }
      
      // Mapear os chats com mensagens para o formato esperado
      const contatos = chatsComMensagens.map((chat: any) => {
        try {
          const id = chat.id._serialized;
          const numero = id.replace('@c.us', '');
          const nome = chat.name || 
                      (chat.contact ? chat.contact.pushname || chat.contact.name : null) || 
                      `Contato ${numero}`;
          
          return { id, numero, nome };
        } catch (e) {
          console.log("© BOT-Orçamento Erro ao extrair informações do chat:", e);
          return null;
        }
      }).filter(Boolean);
      
      // Remover duplicatas
      const contatosUnicos = contatos.filter((contato, index, self) =>
        index === self.findIndex((c) => c.numero === contato.numero)
      );
      
      // Ordenar por nome
      const contatosOrdenados = contatosUnicos.sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );
      
      return contatosOrdenados;
    } catch (error) {
      console.error("© BOT-Orçamento Erro no método alternativo:", error);
      return [];
    }
  }
  
  private async obterContatosPorChats(): Promise<any[]> {
    try {
      console.log("© BOT-Orçamento Obtendo chats...");
      
      // Primeiro obtemos todos os chats
      const chats = await this.client!.getAllChats();
      console.log(`© BOT-Orçamento Chats obtidos: ${chats?.length || 0}`);
      
      // Extrair apenas os IDs dos chats individuais
      const chatIds = chats
        .filter((chat: any) => chat && 
                chat.id && 
                chat.id._serialized && 
                typeof chat.id._serialized === 'string' && 
                chat.id._serialized.includes('@c.us') && 
                !chat.isGroup)
        .map((chat: any) => chat.id._serialized);
      
      console.log(`© BOT-Orçamento IDs de chats individuais filtrados: ${chatIds.length}`);
      
      const contatos = [];
      let contatosProcessados = 0;
      
      // Processar cada chat individualmente para obter mais detalhes
      for (const id of chatIds) {
        try {
          // Obter detalhes do chat por ID
          const chat: any = await this.client!.getChatById(id);
          
          if (chat) {
            const numero = id.replace('@c.us', '');
            // Obter o melhor nome disponível para o contato
            const nome = chat.name || 
                        (chat.contact ? chat.contact.pushname || chat.contact.name : null) || 
                        `Contato ${numero}`;
            
            contatos.push({ id, numero, nome });
            contatosProcessados++;
            
            // Log a cada 5 contatos processados para evitar spam no console
            if (contatosProcessados % 5 === 0) {
              console.log(`© BOT-Orçamento Processados ${contatosProcessados} contatos até agora...`);
            }
          }
        } catch (e) {
          console.log(`© BOT-Orçamento Erro ao processar chat ID ${id}:`, e);
          // Continua para o próximo ID mesmo em caso de erro
          continue;
        }
      }
      
      console.log(`© BOT-Orçamento Total de contatos extraídos: ${contatos.length}`);
      
      // Remover duplicatas
      const contatosUnicos = contatos.filter((contato, index, self) =>
        index === self.findIndex((c) => c.numero === contato.numero)
      );
      
      // Ordenar por nome
      const contatosOrdenados = contatosUnicos.sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );
      
      return contatosOrdenados;
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao obter chats:", error);
      
      // Se falhar, retorna um contato genérico
      const contatoGenerico = [
        {
          id: '5511999999999@c.us',
          numero: '5511999999999',
          nome: 'Digite um número manualmente'
        }
      ];
      
      return contatoGenerico;
    }
  }
  
  public async sendOrcamento(numero: string, mensagem: string) {
    if (!(await this.isConnected()) || !this.client)
      throw new Error("© BOT-Orçamento Não está conectado");

    // Formatação do número seguindo o padrão
    let jid = this.formatNumber(numero);

    try {
      const result = await this.client.sendText(jid, mensagem);
      console.log(`© BOT-Orçamento Mensagem enviada para ${jid}`);
      return {
        success: true,
        message: "© BOT-Orçamento Mensagem enviada com sucesso",
        response: result,
      };
    } catch (error) {
      console.error(
        `© BOT-Orçamento Erro ao enviar mensagem para ${jid}:`,
        error
      );
      throw new Error(
        `© BOT-Orçamento Erro ao enviar mensagem: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async sendOrcamentoPDF(
    numero: string,
    mensagem: string,
    file: { mimetype: string; data: string; filename: string }
  ) {
    if (!(await this.isConnected()) || !this.client)
      throw new Error("© BOT-Orçamento Não está conectado");

    // Formatação do número seguindo o padrão
    let jid = this.formatNumber(numero);

    try {
      const { data, filename } = file;

      // No Venom, usamos sendFileFromBase64 para enviar o PDF
      const result = await this.client.sendFileFromBase64(
        jid,
        data, // Dados do arquivo em base64
        filename, // Nome do arquivo
        mensagem // Mensagem/caption
      );

      console.log(`© BOT-Orçamento PDF enviado para ${jid}`);
      return {
        success: true,
        message: "© BOT-Orçamento PDF enviado com sucesso",
        response: result,
      };
    } catch (error) {
      console.error(`© BOT-Orçamento Erro ao enviar PDF para ${jid}:`, error);
      throw new Error(
        `© BOT-Orçamento Erro ao enviar PDF: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private formatNumber(numero: string): string {
    // Remove caracteres não numéricos
    numero = numero.replace(/\D/g, "");

    // Formatação do número seguindo o padrão
    const numberDDI = numero.substr(0, 2);
    const numberDDD = numero.substr(2, 2);
    const numberUser = numero.substr(-8, 8);

    // Venom-bot exige o formato padrão do WhatsApp: XXXXXXXXXXX@c.us
    if (numberDDI !== "55") {
      return `${numero}@c.us`;
    } else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
      return `55${numberDDD}9${numberUser}@c.us`;
    } else {
      return `55${numberDDD}${numberUser}@c.us`;
    }
  }

  public async disconnect() {
    console.log("© BOT-Orçamento Desconectando...");
    this.ready = false;
    io.emit("message", "© BOT-Orçamento Desconectando...");

    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      this.ultimoQRCodeGerado = null;
      io.emit("message", "© BOT-Orçamento Desconectado com sucesso!");
      io.emit("qr", "./icon.svg");
      console.log("© BOT-Orçamento Desconectado com sucesso");
      return { success: true };
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao desconectar:", error);
      io.emit(
        "message",
        `© BOT-Orçamento Erro ao desconectar: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return { success: false, error };
    }
  }

  public async reconnect() {
    console.log("© BOT-Orçamento Reconectando...");
    io.emit("message", "© BOT-Orçamento Reconectando...");

    try {
      // Primeiro desconectamos
      await this.disconnect();

      // Pequeno delay para garantir que a desconexão foi concluída
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Inicializa novamente com força
      await this.initialize(true);

      return { success: true, ok: true };
    } catch (error) {
      console.error("© BOT-Orçamento Erro ao reconectar:", error);
      io.emit(
        "message",
        `© BOT-Orçamento Erro ao reconectar: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return { success: false, ok: false, error };
    }
  }
}

// Inicializa o bot
export const bot = new WhatsAppBot();
// Inicializamos o bot explicitamente após a exportação
bot.initialize().catch((error) => {
  console.error("© BOT-Orçamento Erro na inicialização inicial:", error);
});
