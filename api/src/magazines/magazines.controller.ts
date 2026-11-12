import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('magazines')
export class MagazinesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.magazine.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        issue: true,
        coverUrl: true,
        price: true,
        description: true,
        helloAssoUrl: true,
      },
    });
  }
}
