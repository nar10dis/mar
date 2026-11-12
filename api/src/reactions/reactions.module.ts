import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller.js';

@Module({ controllers: [ReactionsController] })
export class ReactionsModule {}
