import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // adjust path
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meetings.dto';

@Injectable()
export class MeetingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMeeting(
    dto: CreateMeetingDto,
    userId: number,
    meetLink: string,
    eventId: string,
  ) {
    return this.prisma.meetings.create({
      data: {
        title: dto.title,
        description: dto.description,
        scheduled_by_id: userId,
        scheduled_at: new Date(dto.scheduled_at),
        agenda: dto.agenda,
        notes: dto.notes,
        note_to_self: null,
        google_meet_link: meetLink,
        google_event_id: eventId,
        audit: {},
        attendees: {
          create: dto.attendee_ids.map((id) => ({
            user_id: id,
          })),
        },
      },
    });
  }

  async findAllForUser(user_id: number) {
    return this.prisma.meeting_attendees.findMany({
      where: { user_id },
      include: {
        meeting: {
          include: {
            attendees: {
              include: {
                user: {
                  select: {
                    user_id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
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

  async findById(id: number) {
    return this.prisma.meetings.findUnique({
      where: { id },
      include: { attendees: true },
    });
  }

  async updateMeeting(id: number, dto: UpdateMeetingDto) {
    return this.prisma.meetings.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
        agenda: dto.agenda,
        notes: dto.notes,
        note_to_self: dto.note_to_self,
        audit: { updated_at: new Date() }, // if you're using audit
      },
    });
  }
}
