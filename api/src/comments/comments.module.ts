import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller.js';

@Module({ controllers: [CommentsController] })
export class CommentsModule {}
