import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AdminPolicy } from './admin.policy.js';
import { PrismaSessionStore } from './prisma-session.store.js';
import { SessionAuth } from './session-auth.provider.js';

@Module({
  controllers: [AuthController],
  providers: [PrismaSessionStore, SessionAuth, AdminPolicy],
  exports: [AdminPolicy],
})
export class AuthModule {}
