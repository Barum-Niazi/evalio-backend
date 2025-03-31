import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { TagRepository } from './tag.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [TagController],
  providers: [TagService, TagRepository, PrismaService],
  exports: [TagService],
})
export class TagModule {}
