import type { Server } from 'socket.io';
import type { Message } from '../generated/prisma/client.js';
export declare class MessagesGateway {
    server: Server;
    broadcastNew(message: Message): void;
}
