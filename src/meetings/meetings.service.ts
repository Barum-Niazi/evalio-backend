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
import { MeetingFormatter } from './meeting.formatter';

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly googleService: GoogleService,
    private readonly notificationService: NotificationService,
    private readonly tagService: TagService,
    private readonly formatter: MeetingFormatter,
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

    return this.formatter.formatFullMeetingResponse(meeting.id, userId);
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

  private async processMeetingList(meetings: any[], userId: number) {
    return Promise.all(
      meetings.map((m) =>
        this.formatter.formatFullMeetingResponse(m.id, userId),
      ),
    );
  }

  async getMeetingById(meetingId: number, userId: number) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) throw new NotFoundException('Meeting not found');

    const isAttendee = meeting.attendees.some((a) => a.user_id === userId);
    const isCreator = meeting.scheduled_by_id === userId;

    if (!isCreator && !isAttendee) {
      throw new ForbiddenException('You do not have access to this meeting');
    }

    return this.formatter.formatFullMeetingResponse(meetingId, userId);
  }

  async updateMeeting(
    meetingId: number,
    dto: UpdateMeetingDto,
    userId: number,
  ) {
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) throw new NotFoundException('Meeting not found');

    const isCreator = meeting.scheduled_by_id === userId;
    if (!isCreator) {
      throw new ForbiddenException('Only the creator can update the meeting');
    }

    const updatedAttendeeId =
      dto.attendee_id ??
      meeting.attendees.find((a) => a.user_id !== userId)?.user_id;

    const attendeeIds = [userId, updatedAttendeeId];

    const shouldSync =
      dto.scheduled_at || dto.attendee_id || dto.title || dto.description;

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

      const attendeeEmails =
        await this.meetingRepository.getGoogleEmailsByUserIds(attendeeIds);

      const result = await this.googleService.updateGoogleEvent(
        meeting.google_event_id,
        dto.title ?? meeting.title,
        dto.description ?? meeting.description ?? '',
        start,
        end,
        attendeeEmails,
      );

      if (result.newTokens?.access_token) {
        await this.meetingRepository.updateUserGoogleTokens(userId, {
          access_token: result.newTokens.access_token,
        });
      }

      const message = `Your meeting "${dto.title ?? meeting.title}" has been updated.`;
      for (const id of attendeeIds) {
        await this.notificationService.create(id, 1, message, result.meetLink);
      }
    }

    // 📝 Update note if provided
    if (dto.note_update?.content) {
      await this.meetingRepository.addMeetingNote({
        meeting_id: meetingId,
        author_id: userId,
        content: dto.note_update.content,
        visible_to_other: dto.note_update.visible_to_other ?? false,
      });
    }

    // Replace agenda items if provided
    if (dto.agenda_items?.length) {
      await this.meetingRepository.replaceAgendaItems(
        meetingId,
        userId,
        dto.agenda_items,
      );
    }

    return this.formatter.formatFullMeetingResponse(meetingId, userId);
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
          1,
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
