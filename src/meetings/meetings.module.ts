import { Module } from '@nestjs/common';
import { MeetingService } from './meetings.service';
import { MeetingController } from './meetings.controller';
import { MeetingRepository } from './meetings.repository';
import { GoogleService } from 'src/services/google.service'; // shared Google service
import { PrismaService } from 'src/prisma/prisma.service'; // your Prisma provider

@Module({
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository, GoogleService, PrismaService],
})
export class MeetingModule {}
