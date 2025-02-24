import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TagsRepository } from './tags.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TagsController],
  providers: [TagsService, TagsRepository, PrismaService],
  exports: [TagsService], // Allow other modules to use it
})
export class TagsModule {}
