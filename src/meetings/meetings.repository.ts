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
        agenda: null,
        google_meet_link: meetLink,
        google_event_id: eventId,
        audit: {},

        attendees: {
          create: [
            { user_id: dto.attendee_id },
            { user_id: userId }, // the creator/scheduler
          ],
        },
      },
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
    });
  }

  async createAgendaItems(
    contents: string[],
    meetingId: number,
    authorId: number,
  ) {
    return Promise.all(
      contents.map((content) =>
        this.prisma.meeting_agenda_item.create({
          data: {
            content,
            meeting_id: meetingId,
            author_id: authorId,
          },
        }),
      ),
    );
  }

  async createInitialMeetingNote(params: {
    meeting_id: number;
    author_id: number;
    content: string;
    visible_to_other: boolean;
  }) {
    return this.prisma.meeting_notes.create({
      data: {
        meeting_id: params.meeting_id,
        author_id: params.author_id,
        content: params.content,
        visible_to_other: params.visible_to_other,
      },
    });
  }
  async findAllForUser(userId: number) {
    const [scheduled, attendingRaw] = await this.prisma.$transaction([
      this.prisma.meetings.findMany({
        where: { scheduled_by_id: userId },
        include: {
          attendees: {
            include: { user: { select: { user_id: true, name: true } } },
          },
        },
      }),
      this.prisma.meeting_attendees.findMany({
        where: {
          user_id: userId,
          meeting: { NOT: { scheduled_by_id: userId } },
        },
        include: {
          meeting: {
            include: {
              attendees: {
                include: { user: { select: { user_id: true, name: true } } },
              },
            },
          },
        },
      }),
    ]);

    const attending = attendingRaw.map((entry) => entry.meeting);

    return {
      scheduledByUser: scheduled,
      youAreAttending: attending,
    };
  }

  async getAgendaItemsForMeetings(meetingIds: number | number[]) {
    const ids = Array.isArray(meetingIds) ? meetingIds : [meetingIds];

    return this.prisma.meeting_agenda_item.findMany({
      where: {
        meeting_id: { in: ids },
      },
      orderBy: { created_at: 'asc' },
    });
  }
  async getNotesForMeetings(meetingIds: number | number[]) {
    const ids = Array.isArray(meetingIds) ? meetingIds : [meetingIds];

    return this.prisma.meeting_notes.findMany({
      where: {
        meeting_id: { in: ids },
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

  async findById(meetingId: number) {
    return this.prisma.meetings.findUnique({
      where: { id: meetingId },
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
    });
  }

  async updateMeetingMetadata(id: number, dto: UpdateMeetingDto) {
    return this.prisma.meetings.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
        audit: { updated_at: new Date() },
      },
    });
  }

  async addMeetingNote({
    meeting_id,
    author_id,
    content,
    visible_to_other,
  }: {
    meeting_id: number;
    author_id: number;
    content: string;
    visible_to_other: boolean;
  }) {
    return this.prisma.meeting_notes.create({
      data: {
        meeting_id,
        author_id,
        content,
        visible_to_other,
      },
    });
  }

  async replaceAgendaItems(
    meetingId: number,
    authorId: number,
    contents: string[],
  ) {
    await this.prisma.meeting_agenda_item.deleteMany({
      where: {
        meeting_id: meetingId,
        author_id: authorId,
      },
    });

    return this.prisma.meeting_agenda_item.createMany({
      data: contents.map((content) => ({
        meeting_id: meetingId,
        author_id: authorId,
        content,
      })),
    });
  }

  async deleteMeeting(id: number) {
    const [notesResult, agendaResult, attendeesResult, meeting, tagsResult] =
      await this.prisma.$transaction([
        this.prisma.meeting_notes.deleteMany({ where: { meeting_id: id } }),
        this.prisma.meeting_agenda_item.deleteMany({
          where: { meeting_id: id },
        }),
        this.prisma.meeting_attendees.deleteMany({ where: { meeting_id: id } }),
        this.prisma.meetings.delete({ where: { id } }), // returns the deleted meeting
        this.prisma.tags.deleteMany({
          where: { parent_entity_id: id, parent_entity_type: 'MEETING' },
        }),
      ]);

    return {
      deleted_meeting: {
        id: meeting.id,
        title: meeting.title,
        scheduled_at: meeting.scheduled_at,
        google_meet_link: meeting.google_meet_link,
      },
      deleted_counts: {
        notes: notesResult.count,
        agenda_items: agendaResult.count,
        attendees: attendeesResult.count,
        tags: tagsResult.count,
      },
    };
  }

  async getUserDetails(userId: number) {
    return this.prisma.user_details.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
      },
    });
  }
}
