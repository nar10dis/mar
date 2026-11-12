import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminContentController } from './admin-content.controller.js';
import { AdminModerationController } from './admin-moderation.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminContentController, AdminModerationController],
})
export class AdminModule {}
