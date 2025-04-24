import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // adjust path
import { CreateMeetingDto } from './dto/meetings.dto';

@Injectable()
export class MeetingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMeeting(
    dto: CreateMeetingDto,
    scheduled_by_id: number,
    google_meet_link: string,
  ) {
    return this.prisma.meetings.create({
      data: {
        title: dto.title,
        description: dto.description,
        scheduled_at: new Date(dto.scheduled_at),
        agenda: dto.agenda,
        notes: dto.notes,
        note_to_self: dto.note_to_self,
        scheduled_by_id,
        google_meet_link,
        attendees: {
          createMany: {
            data: dto.attendee_ids.map((user_id) => ({ user_id })),
          },
        },
      },
      include: {
        attendees: true,
      },
    });
  }

  async findAllForUser(user_id: number) {
    return this.prisma.meeting_attendees.findMany({
      where: { user_id },
      include: {
        meeting: true,
      },
    });
  }
  async getUserGoogleTokens(user_id: number) {
    return this.prisma.user_auth.findFirst({
      where: { user_id },
      select: {
        google_access_token: true,
        google_refresh_token: true,
        google_email: true,
      },
    });
  }

  async getGoogleEmailsByUserIds(userIds: number[]): Promise<string[]> {
    const users = await this.prisma.user_auth.findMany({
      where: {
        user_id: { in: userIds },
        google_email: { not: null },
      },
      select: {
        google_email: true,
      },
    });

    return users.map((u) => u.google_email);
  }

  async updateUserGoogleTokens(
    userId: number,
    tokens: { access_token?: string },
  ) {
    return this.prisma.user_auth.update({
      where: { user_id: userId },
      data: {
        google_access_token: tokens.access_token,
      },
    });
  }
}
