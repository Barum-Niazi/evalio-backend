import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meetings.dto';
import { MeetingRepository } from './meetings.repository';
import { GoogleService } from 'src/services/google.service'; // adjust path
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class MeetingService {
  constructor(
    private readonly repo: MeetingRepository,
    private readonly googleService: GoogleService,
    private readonly notificationService: NotificationService, // Assuming you have a notification service
  ) {}

  async createMeeting(dto: CreateMeetingDto, userId: number) {
    const auth = await this.repo.getUserGoogleTokens(userId);
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

    const attendeeEmails = await this.repo.getGoogleEmailsByUserIds(
      dto.attendee_ids,
    );

    const { meetLink, eventId, newTokens } =
      await this.googleService.createGoogleMeetEvent(
        dto.title,
        dto.description ?? '',
        start,
        end,
        attendeeEmails,
      );

    // If token was refreshed during the process, update it in DB
    if (newTokens?.access_token) {
      await this.repo.updateUserGoogleTokens(userId, {
        access_token: newTokens.access_token,
      });
    }

    const meeting = await this.repo.createMeeting(
      dto,
      userId,
      meetLink,
      eventId,
    );

    const message = `You've been invited to a meeting: ${dto.title}`;
    for (const attendeeId of dto.attendee_ids) {
      await this.notificationService.create(
        attendeeId,
        1, // Replace with correct notification type ID if needed
        message,
        meetLink,
      );
    }

    return meeting;
  }

  async getMeetingsForUser(user_id: number) {
    return this.repo.findAllForUser(user_id);
  }

  async updateMeeting(
    meetingId: number,
    dto: UpdateMeetingDto,
    userId: number,
  ) {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.scheduled_by_id !== userId)
      throw new ForbiddenException('You can only update meetings you created');

    const shouldSync =
      dto.scheduled_at || dto.attendee_ids || dto.title || dto.description;

    if (shouldSync && meeting.google_event_id) {
      const auth = await this.repo.getUserGoogleTokens(userId);
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
        await this.repo.getGoogleEmailsByUserIds(attendeeIds);

      const { meetLink, newTokens } =
        await this.googleService.updateGoogleEvent(
          meeting.google_event_id,
          dto.title ?? meeting.title,
          dto.description ?? meeting.description ?? '',
          start,
          end,
          attendeeEmails,
        );

      if (newTokens?.access_token) {
        await this.repo.updateUserGoogleTokens(userId, {
          access_token: newTokens.access_token,
        });
      }
    }

    return this.repo.updateMeeting(meetingId, dto);
  }
}
