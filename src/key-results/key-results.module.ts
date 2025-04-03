import { Module } from '@nestjs/common';
import { KeyResultsService } from './key-results.service';
import { KeyResultsController } from './key-results.controller';
import { KeyResultsRepository } from './key-results.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [KeyResultsController],
  providers: [KeyResultsService, KeyResultsRepository, PrismaService],
  exports: [KeyResultsService],
})
export class KeyResultsModule {}
