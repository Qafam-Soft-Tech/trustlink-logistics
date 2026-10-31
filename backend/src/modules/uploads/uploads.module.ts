import { Module } from '@nestjs/common';

import { UploadsController } from './uploads.controller';
import { StorageService, storageProvider } from './storage.service';

@Module({
  controllers: [UploadsController],
  providers: [storageProvider],
  exports: [StorageService],
})
export class UploadsModule {}
