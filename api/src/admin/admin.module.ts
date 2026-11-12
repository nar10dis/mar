import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminContentController } from './admin-content.controller.js';
import { AdminModerationController } from './admin-moderation.controller.js';

@Module({
  imports: [AuthModule, ArticlesModule],
  controllers: [AdminContentController, AdminModerationController],
})
export class AdminModule {}
