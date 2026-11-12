import { Controller, Get } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { PrismaService } from './prisma/prisma.service.js';

@Public()
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
