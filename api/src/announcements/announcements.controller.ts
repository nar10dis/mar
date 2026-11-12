import { Controller, Get } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';

@Public()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, createdAt: true },
    });
  }
}
