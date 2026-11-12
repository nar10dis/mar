import { Global, Module } from '@nestjs/common';
import { StorageController } from './storage.controller.js';
import { StorageService } from './storage.service.js';
import { UploadsService } from './uploads.service.js';

@Global()
@Module({
  controllers: [StorageController],
  providers: [StorageService, UploadsService],
  exports: [StorageService, UploadsService],
})
export class StorageModule {}
