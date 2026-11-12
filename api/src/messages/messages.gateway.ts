import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { Message } from '../generated/prisma/client.js';

// Same origin as the HTTP server: in prod Nest serves the front, in dev Vite proxies /socket.io.
@WebSocketGateway()
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  broadcastNew(message: Message) {
    this.server.emit('message:new', message);
  }
}
