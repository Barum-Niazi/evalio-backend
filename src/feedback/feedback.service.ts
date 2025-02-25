import { Injectable } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { TagsService } from '../tags/tags.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepo: FeedbackRepository,
    private readonly tagsService: TagsService,
  ) {}

  async createFeedback(dto: CreateFeedbackDto) {
    // Step 1: Create Feedback Entry
    const feedback = await this.feedbackRepo.createFeedback(dto);

    // Step 2: Automatically create a tag for this feedback
    await this.tagsService.autoCreateTagForEntity({
      entityId: feedback.id,
      entityType: 'feedback',
      entityName: dto.feedbackText,
      tagIds: [],
    });

    // Step 3: Associate feedback with provided tags (if any)
    if (dto.tagIds?.length) {
      await this.tagsService.tagEntity({
        entityId: feedback.id,
        entityType: 'feedback',
        tagIds: dto.tagIds,
        entityName: dto.feedbackText,
      });
    }

    return feedback;
  }

  async updateFeedback(id: number, dto: UpdateFeedbackDto) {
    return this.feedbackRepo.updateFeedback(id, dto);
  }

  async getFeedbackById(id: number) {
    const feedback = await this.feedbackRepo.getFeedbackById(id);
    const tags = await this.tagsService.getTagsForEntity(id, 'feedback');
    return { ...feedback, tags };
  }

  async getAllFeedback() {
    return this.feedbackRepo.getAllFeedback();
  }

  async deleteFeedback(id: number) {
    await this.tagsService.removeTagsFromEntity(id, 'feedback');
    return this.feedbackRepo.deleteFeedback(id);
  }
}
