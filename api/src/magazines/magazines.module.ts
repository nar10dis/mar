import { Module } from '@nestjs/common';
import { MagazinesController } from './magazines.controller.js';

@Module({ controllers: [MagazinesController] })
export class MagazinesModule {}
