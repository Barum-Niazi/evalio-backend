import { Injectable } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
// import { TagsService } from '../tags/tags.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepo: FeedbackRepository,
    // private readonly tagsService: TagsService, // Using TagsService for tagging operations
  ) {}

  async createFeedback(dto: CreateFeedbackDto) {
    const feedback = await this.feedbackRepo.createFeedback(dto);

    // Delegate tagging to TagsService
    // if (dto.tag_ids?.length) {
    //   await this.tagsService.tagEntity(feedback.id, 'feedback', dto.tag_ids);
    // }

    return feedback;
  }

  async updateFeedback(id: number, dto: UpdateFeedbackDto) {
    const feedback = await this.feedbackRepo.updateFeedback(id, dto);

    // Update tags using TagsService
    // if (dto.tag_ids) {
    //   await this.tagsService.untagEntity(id, 'feedback', dto.tag_ids);
    //   await this.tagsService.tagEntity(id, 'feedback', dto.tag_ids);
    // }

    return feedback;
  }

  async getFeedbackById(id: number) {
    const feedback = await this.feedbackRepo.getFeedbackById(id);
    // const tags = await this.tagsService.getTagsForEntity(id, 'feedback'); // Fetch tags separately
    // return { ...feedback, tags };
    return feedback;
  }

  async getUserFeedback(userId: number, type: 'sent' | 'received') {
    return this.feedbackRepo.getUserFeedback(userId, type);
  }

  async getAllFeedback() {
    return this.feedbackRepo.getAllFeedback();
  }

  async deleteFeedback(id: number) {
    // await this.tagsService.removeTagsFromEntity(id, 'feedback'); // Remove tags before deleting feedback
    return this.feedbackRepo.deleteFeedback(id);
  }
}
