import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleService {
  private oauth2Client;

  constructor(private configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent',
    });
  }

  async setCredentials(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    return { tokens, email };
  }

  setToken(token) {
    this.oauth2Client.setCredentials(token);
  }

  async createGoogleMeetEvent(
    summary: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attendeeEmails: string[],
  ): Promise<{ meetLink: string | null; newTokens?: any }> {
    const calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client,
    });

    const event = {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });

      return {
        meetLink: response.data?.conferenceData?.entryPoints?.[0]?.uri ?? null,
      };
    } catch (err) {
      if (err.code === 401 && this.oauth2Client.credentials.refresh_token) {
        console.warn('Access token expired, refreshing...');
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken(); // deprecated but fine here
          this.oauth2Client.setCredentials(credentials);

          const retryResponse = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all',
          });

          return {
            meetLink:
              retryResponse.data?.conferenceData?.entryPoints?.[0]?.uri ?? null,
            newTokens: credentials,
          };
        } catch (refreshErr) {
          throw new Error('Token refresh failed: ' + refreshErr.message);
        }
      }

      throw err;
    }
  }
}
