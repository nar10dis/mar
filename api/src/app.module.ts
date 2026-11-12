import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { join } from 'node:path';
import { AccountModule } from './account/account.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AnnouncementsModule } from './announcements/announcements.module.js';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { MagazinesModule } from './magazines/magazines.module.js';
import { PresenceModule } from './presence/presence.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';
import { ThemesModule } from './themes/themes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Serves the React build (web/dist) so the whole site is one service and one URL.
    ServeStaticModule.forRoot({
      rootPath: process.env.WEB_DIST ?? join(import.meta.dirname, '..', '..', 'web', 'dist'),
      exclude: ['/api/{*path}'],
    }),
    // Ordre important : l'authentification pose request.user, que l'autorisation lit ensuite.
    // Les deux installent un guard global : toute route est fermée sauf @Public() / @Can…
    AuthenticationModule.forRoot({
      session: {
        absoluteTtl: '30d',
        idleTtl: '7d',
        metadata: (req) => ({ userAgent: req.headers['user-agent']?.slice(0, 200) }),
      },
    }),
    AuthorizationModule.forRoot(),
    PrismaModule,
    StorageModule,
    AuthModule,
    AccountModule,
    AdminModule,
    ThemesModule,
    MagazinesModule,
    AnnouncementsModule,
    PresenceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
