import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('themes')
export class ThemesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.theme.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, slug: true, name: true, color: true },
    });
  }
}
