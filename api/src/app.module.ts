import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller.js';
import { ThemesModule } from './themes/themes.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Serves the React build (web/dist) so the whole demo is one service and one URL.
    ServeStaticModule.forRoot({
      rootPath: process.env.WEB_DIST ?? join(import.meta.dirname, '..', '..', 'web', 'dist'),
      exclude: ['/api/{*path}'],
    }),
    PrismaModule,
    ThemesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
