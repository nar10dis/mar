import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MessagesGateway } from './messages.gateway.js';

export interface CreateMessageInput {
  author?: unknown;
  content?: unknown;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagesGateway,
  ) {}

  findLatest(limit = 50) {
    return this.prisma.message.findMany({
      orderBy: { id: 'asc' },
      take: -limit,
    });
  }

  async create(input: CreateMessageInput) {
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
}
