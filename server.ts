import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { registerSocketServer } from "./src/server/socketServer";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./src/types/socket-events";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    path: "/api/socket",
  });

  registerSocketServer(io);

  httpServer.listen(port, () => {
    console.log(`> Secret Bug ready on http://${hostname}:${port}`);
  });
});
