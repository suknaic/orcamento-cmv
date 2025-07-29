import io from "./server";

io.on("connection", (socket) => {
  console.log("Cliente conectado ao Socket.IO");

  socket.on("enviarOrcamento", (dados) => {
    // Aqui você pode processar os dados do orçamento e enviar para o WhatsApp
    // Exemplo: whatsappService.enviar(dados)
    socket.emit("statusOrcamento", { status: "enviado", dados });
  });
});
