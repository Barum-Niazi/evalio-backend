import { Injectable } from '@nestjs/common';
import { MeetingRepository } from './meetings.repository';
import { scheduled } from 'rxjs';

@Injectable()
export class MeetingFormatter {
  constructor(private readonly repo: MeetingRepository) {}

  async formatFullMeetingResponse(meetingId: number, userId: number) {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) return null;

    const agendaItems = await this.repo.getAgendaItemsForMeetings(meetingId);
    const notes = await this.repo.getNotesForMeetings(meetingId);

    const yourNotes = notes
      .filter((n) => n.author_id === userId)
      .map((n) => ({
        content: n.content,
        author_id: n.author_id,
        visible_to_other: n.visible_to_other,
        created_at: n.created_at,
      }));

    const sharedNotes = notes
      .filter((n) => n.author_id !== userId && n.visible_to_other)
      .map((n) => ({
        content: n.content,
        author_id: n.author_id,
        created_at: n.created_at,
      }));

    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      scheduled_at: meeting.scheduled_at,
      scheduled_by: meeting.scheduled_by_id,
      google_meet_link: meeting.google_meet_link,
      attendees: meeting.attendees.map((a) => ({
        user_id: a.user.user_id,
        name: a.user.name,
      })),
      agenda: agendaItems.map((item) => item.content),
      your_notes: yourNotes,
      shared_notes: sharedNotes,
    };
  }
}
