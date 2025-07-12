import { Module } from '@nestjs/common';
import { BlobController } from './blob.controller';
import { BlobService } from './blob.service';
import { BlobRepository } from './blob.repository';

@Module({
  providers: [BlobService, BlobRepository],
  controllers: [BlobController],
  exports: [BlobService, BlobRepository],
})
export class BlobModule {}
