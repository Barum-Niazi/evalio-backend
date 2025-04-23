import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateMeetingDto } from './dto/meetings.dto';
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
    console.log(auth);

    if (!auth?.google_access_token || !auth?.google_refresh_token) {
      throw new ForbiddenException('Google tokens not found for user');
    }

    this.googleService.setToken({
      access_token: auth.google_access_token,
      refresh_token: auth.google_refresh_token,
    });

    const start = new Date(dto.scheduled_at);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const link = await this.googleService.createGoogleMeetEvent(
      dto.title,
      dto.description ?? '',
      start,
      end,
    );

    const meeting = await this.repo.createMeeting(dto, userId, link);

    const message = `You've been invited to a meeting: ${dto.title}`;
    for (const attendeeId of dto.attendee_ids) {
      await this.notificationService.create(
        attendeeId,
        1, // use your actual notification type ID here
        message,
        link,
      );
    }

    return meeting;
  }

  async getMeetingsForUser(user_id: number) {
    return this.repo.findAllForUser(user_id);
  }
}
