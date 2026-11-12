import { Module } from '@nestjs/common';
import { ThemesController } from './themes.controller.js';

@Module({ controllers: [ThemesController] })
export class ThemesModule {}
