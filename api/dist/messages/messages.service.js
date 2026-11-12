var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MessagesGateway } from './messages.gateway.js';
let MessagesService = class MessagesService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    findLatest(limit = 50) {
        return this.prisma.message.findMany({
            orderBy: { createdAt: 'asc' },
            take: -limit,
        });
    }
    async create(input) {
        const author = typeof input.author === 'string' ? input.author.trim() : '';
        const content = typeof input.content === 'string' ? input.content.trim() : '';
        if (!author || !content) {
            throw new BadRequestException('author and content are required');
        }
        const message = await this.prisma.message.create({
            data: { author: author.slice(0, 50), content: content.slice(0, 1000) },
        });
        this.gateway.broadcastNew(message);
        return message;
    }
};
MessagesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        MessagesGateway])
], MessagesService);
export { MessagesService };
//# sourceMappingURL=messages.service.js.map