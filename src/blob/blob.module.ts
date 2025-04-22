import { Module } from '@nestjs/common';
import { BlobService } from './blob.service';
import { BlobController } from './blob.controller';

@Module({
  providers: [BlobService],
  controllers: [BlobController]
})
export class BlobModule {}
