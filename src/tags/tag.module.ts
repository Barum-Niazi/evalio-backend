import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { TagRepository } from './tag.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackRepository } from 'src/feedback/feedback.repository';

@Module({
  imports: [],
  controllers: [TagController],
  providers: [TagService, TagRepository, PrismaService, FeedbackRepository],
  exports: [TagService, TagRepository],
})
export class TagModule {}
