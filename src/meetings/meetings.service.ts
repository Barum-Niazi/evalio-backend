import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meetings.dto';
import { MeetingRepository } from './meetings.repository';
import { GoogleService } from 'src/services/google.service'; // adjust path
import { NotificationService } from 'src/notification/notification.service';
import { TagService } from 'src/tags/tag.service';

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly googleService: GoogleService,
    private readonly notificationService: NotificationService,
    private readonly tagService: TagService,
  ) {}

  async createMeeting(dto: CreateMeetingDto, userId: number) {
    const auth = await this.meetingRepository.getUserGoogleTokens(userId);
    if (!auth?.google_access_token || !auth?.google_refresh_token) {
      throw new ForbiddenException('Google tokens not found for user');
    }

    this.googleService.setToken({
      access_token: auth.google_access_token,
      refresh_token: auth.google_refresh_token,
    });

    const start = new Date(dto.scheduled_at);
    const durationMinutes = dto.duration_minutes ?? 30;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const attendeeEmails =
      await this.meetingRepository.getGoogleEmailsByUserIds([dto.attendee_id]);

    const { meetLink, eventId, newTokens } =
      await this.googleService.createGoogleMeetEvent(
        dto.title,
        dto.description ?? '',
        start,
        end,
        attendeeEmails,
      );

    if (newTokens?.access_token) {
      await this.meetingRepository.updateUserGoogleTokens(userId, {
        access_token: newTokens.access_token,
      });
    }

    const meeting = await this.meetingRepository.createMeeting(
      dto,
      userId,
      meetLink,
      eventId,
    );

    let agendaItems = [];
    if (dto.agenda_items?.length) {
      agendaItems = await this.meetingRepository.createAgendaItems(
        dto.agenda_items,
        meeting.id,
        userId,
      );
    }

    let initialNote = null;
    if (dto.initial_note) {
      initialNote = await this.meetingRepository.createInitialMeetingNote({
        meeting_id: meeting.id,
        author_id: userId,
        content: dto.initial_note.content,
        visible_to_other: dto.initial_note.visible_to_other ?? false,
      });
    }

    await this.notificationService.create(
      dto.attendee_id,
      1, // Replace with actual notification type ID
      `You've been invited to a meeting: ${dto.title}`,
      meetLink,
    );

    // await this.tagService.createTagforEntities(
    //   meeting.title,
    //   meeting.description,
    //   meeting.id,
    //   'MEETING',
    // );

    const attendee = await this.meetingRepository.getUserDetails(
      dto.attendee_id,
    );

    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      scheduled_at: meeting.scheduled_at,
      google_meet_link: meeting.google_meet_link,
      attendees: meeting.attendees.map((a) => ({
        user_id: a.user.user_id,
        name: a.user.name,
      })),
      agenda: agendaItems.map((item) => item.content),
      initial_note: initialNote
        ? {
            content: initialNote.content,
            visible_to_other: initialNote.visible_to_other,
          }
        : null,
    };
  }

  async getMeetingsForUser(userId: number) {
    const meetings = await this.meetingRepository.findAllForUser(userId);
    return Promise.all([
      this.processMeetingList(meetings.scheduledByUser, userId),
      this.processMeetingList(meetings.youAreAttending, userId),
    ]).then(([scheduled, attending]) => ({
      scheduledByYou: scheduled,
      youAreAttending: attending,
    }));
  }

  private async processMeetingList(meetings: any[], currentUserId: number) {
    const meetingIds = meetings.map((m) => m.id);

    const [agendaItems, meetingNotes] = await Promise.all([
      this.meetingRepository.getAgendaItemsForMeetings(meetingIds),
      this.meetingRepository.getNotesForMeetings(meetingIds),
    ]);

    const agendaMap = this.groupAgendaItemsByMeeting(agendaItems);
    const noteMap = this.groupNotesByMeeting(meetingNotes, currentUserId);

    return meetings.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      scheduled_at: m.scheduled_at,
      scheduled_by_id: m.scheduled_by_id,
      google_meet_link: m.google_meet_link,
      attendees: m.attendees.map((a) => ({
        user_id: a.user.user_id,
        name: a.user.name,
      })),
      agenda: agendaMap[m.id] ?? [],
      your_note: noteMap[m.id]?.yourNote ?? null,
      shared_note: noteMap[m.id]?.sharedNote ?? null,
    }));
  }

  private groupAgendaItemsByMeeting(agendaItems) {
    const result = {};
    for (const item of agendaItems) {
      if (!result[item.meeting_id]) result[item.meeting_id] = [];
      result[item.meeting_id].push(item.content);
    }
    return result;
  }

  private groupNotesByMeeting(notes, currentUserId: number) {
    const result = {};
    for (const note of notes) {
      const meetingId = note.meeting_id;
      if (!result[meetingId]) result[meetingId] = {};

      if (note.author_id === currentUserId) {
        result[meetingId].yourNote = {
          content: note.content,
          visible_to_other: note.visible_to_other,
        };
      } else if (note.visible_to_other) {
        // SAFEGUARD: Only show their note if explicitly shared
        result[meetingId].sharedNote = {
          content: note.content,
        };
      }
    }
    return result;
  }

  async getMeetingById(meetingId: number, userId: number) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) throw new NotFoundException('Meeting not found');

    const isAttendee = meeting.attendees.some((a) => a.user_id === userId);
    if (meeting.scheduled_by_id !== userId && !isAttendee) {
      throw new ForbiddenException('You do not have access to this meeting');
    }

    const agendaItems =
      await this.meetingRepository.getAgendaItemsForMeetings(meetingId);
    const notes = await this.meetingRepository.getNotesForMeetings(meetingId);

    const yourNote = notes.find((n) => n.author_id === userId);
    const sharedNote = notes.find(
      (n) => n.author_id !== userId && n.visible_to_other,
    );

    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      scheduled_at: meeting.scheduled_at,
      google_meet_link: meeting.google_meet_link,
      attendees: meeting.attendees.map((a) => ({
        user_id: a.user.user_id,
        name: a.user.name,
      })),
      agenda: agendaItems.map((item) => item.content),
      your_note: yourNote
        ? {
            content: yourNote.content,
            visible_to_other: yourNote.visible_to_other,
          }
        : null,
      shared_note: sharedNote
        ? {
            content: sharedNote.content,
          }
        : null,
    };
  }

  async updateMeeting(
    meetingId: number,
    dto: UpdateMeetingDto,
    userId: number,
  ) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.scheduled_by_id !== userId)
      throw new ForbiddenException('You can only update meetings you created');

    const shouldSync =
      dto.scheduled_at || dto.attendee_ids || dto.title || dto.description;

    if (shouldSync && meeting.google_event_id) {
      const auth = await this.meetingRepository.getUserGoogleTokens(userId);
      if (!auth?.google_access_token || !auth?.google_refresh_token) {
        throw new ForbiddenException('Google tokens not found for user');
      }

      this.googleService.setToken({
        access_token: auth.google_access_token,
        refresh_token: auth.google_refresh_token,
      });

      const start = dto.scheduled_at
        ? new Date(dto.scheduled_at)
        : new Date(meeting.scheduled_at);
      const duration = dto.duration_minutes ?? 30;
      const end = new Date(start.getTime() + duration * 60 * 1000);

      const attendeeIds =
        dto.attendee_ids ?? meeting.attendees.map((a) => a.user_id);
      const attendeeEmails =
        await this.meetingRepository.getGoogleEmailsByUserIds(attendeeIds);

      const { meetLink, newTokens } =
        await this.googleService.updateGoogleEvent(
          meeting.google_event_id,
          dto.title ?? meeting.title,
          dto.description ?? meeting.description ?? '',
          start,
          end,
          attendeeEmails,
        );

      const message = `Your meeting "${dto.title ?? meeting.title}" has been updated.`;
      for (const attendeeId of attendeeIds) {
        await this.notificationService.create(
          attendeeId,
          1, // Replace with correct notification type ID if needed
          message,
          meetLink,
        );
      }
      if (newTokens?.access_token) {
        await this.meetingRepository.updateUserGoogleTokens(userId, {
          access_token: newTokens.access_token,
        });
      }
    }

    return this.meetingRepository.updateMeeting(meetingId, dto);
  }
  async deleteMeeting(meetingId: number, userId: number) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.scheduled_by_id !== userId)
      throw new ForbiddenException('You can only delete meetings you created');

    if (meeting.google_event_id) {
      const auth = await this.meetingRepository.getUserGoogleTokens(userId);
      if (!auth?.google_access_token || !auth?.google_refresh_token) {
        throw new ForbiddenException('Google tokens not found for user');
      }

      this.googleService.setToken({
        access_token: auth.google_access_token,
        refresh_token: auth.google_refresh_token,
      });
      const message = `Your meeting "${meeting.title}" has been deleted.`;
      for (const attendee of meeting.attendees) {
        await this.notificationService.create(
          attendee.user_id,
          1, // Replace with correct notification type ID if needed
          message,
          null, // No link since the meeting is deleted
        );
      }
      try {
        await this.googleService.deleteGoogleEvent(meeting.google_event_id);
      } catch (err) {
        console.error('Failed to delete Google event:', err.message);
      }
    }

    return this.meetingRepository.deleteMeeting(meetingId);
  }
}
