import { Injectable } from '@nestjs/common';
import Mailgun from 'mailgun.js';
import * as FormData from 'form-data';

@Injectable()
export class EmailService {
  private mg;

  constructor() {
    const apiKey = process.env.MAILGUN_API_KEY; // Your Mailgun API Key
    const domain = process.env.MAILGUN_DOMAIN; // Your Mailgun sandbox domain

    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({ username: 'api', key: apiKey });
  }

  async sendEmail(to: string, subject: string, text: string) {
    try {
      const response = await this.mg.messages.create(
        process.env.MAILGUN_DOMAIN,
        {
          from: 'Your App ' + ' <mailgun@' + process.env.MAILGUN_DOMAIN + '>',
          to,
          subject,
          text,
        },
      );
      console.log('Email sent:', response);
      return response;
    } catch (error) {
      console.error(
        'Error sending email:',
        error.response || error.message || error,
      );
      throw new Error('Failed to send email');
    }
  }
}
