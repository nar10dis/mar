import { MessagesService } from './messages.service.js';
import type { CreateMessageInput } from './messages.service.js';
export declare class MessagesController {
    private readonly messages;
    constructor(messages: MessagesService);
    list(): import("../generated/prisma/internal/prismaNamespace.js").PrismaPromise<{
        id: number;
        author: string;
        content: string;
        createdAt: Date;
    }[]>;
    create(body: CreateMessageInput): Promise<{
        id: number;
        author: string;
        content: string;
        createdAt: Date;
    }>;
}
