import { Injectable } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async createFeedback(dto: CreateFeedbackDto) {
    return this.feedbackRepository.createFeedback(dto);
  }

  async updateFeedback(id: number, dto: UpdateFeedbackDto) {
    return this.feedbackRepository.updateFeedback(id, dto);
  }

  async getFeedbackById(id: number) {
    return this.feedbackRepository.getFeedbackById(id);
  }

  async getUserFeedback(userId: number, type: 'sent' | 'received') {
    return this.feedbackRepository.getUserFeedback(userId, type);
  }

  async getAllFeedback() {
    return this.feedbackRepository.getAllFeedback();
  }

  async deleteFeedback(id: number) {
    return this.feedbackRepository.deleteFeedback(id);
  }
}
