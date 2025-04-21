import { Module } from '@nestjs/common';
import { MeetingService } from './meetings.service';
import { MeetingController } from './meetings.controller';
import { MeetingRepository } from './meetings.repository';
import { GoogleService } from 'src/services/google.service'; // shared Google service
import { PrismaService } from 'src/prisma/prisma.service'; // your Prisma provider
import { NotificationModule } from 'src/notification/notification.module';
import { TagModule } from 'src/tags/tag.module';

@Module({
  imports: [NotificationModule, TagModule], // Assuming you have a NotificationModule
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository, GoogleService, PrismaService],
})
export class MeetingModule {}
