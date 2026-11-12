import { PrismaService } from '../prisma/prisma.service.js';
import { MessagesGateway } from './messages.gateway.js';
export interface CreateMessageInput {
    author?: unknown;
    content?: unknown;
}
export declare class MessagesService {
    private readonly prisma;
    private readonly gateway;
    constructor(prisma: PrismaService, gateway: MessagesGateway);
    findLatest(limit?: number): import("../generated/prisma/internal/prismaNamespace.js").PrismaPromise<{
        id: number;
        author: string;
        content: string;
        createdAt: Date;
    }[]>;
    create(input: CreateMessageInput): Promise<{
        id: number;
        author: string;
        content: string;
        createdAt: Date;
    }>;
}
