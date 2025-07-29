import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Cliente conectado ao Socket.IO");
});

httpServer.listen(3001, () => {
  console.log("Socket.IO server rodando na porta 3001");
});

export default io;
