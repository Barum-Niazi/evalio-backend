import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Create feedback and associate tags properly
  async createFeedback(dto: CreateFeedbackDto) {
    const {
      tag_ids = [],
      feedback_tag_ids = [],
      tagged_entities = [],
      ...feedbackData
    } = dto;

    // Step 1: Create feedback entry
    const feedback = await this.prisma.feedback.create({
      data: { ...feedbackData },
    });

    // Step 2: Associate general tags with feedback
    if (tag_ids.length > 0) {
      await this.prisma.tagged_entities.createMany({
        data: tag_ids.map((tagId) => ({
          tag_id: tagId,
          entity_id: feedback.id,
          entity_type: 'feedback',
        })),
      });
    }

    // Step 3: Associate feedback-to-feedback tagging (Ensure tags exist)
    if (feedback_tag_ids.length > 0) {
      const tagReferences = await this.prisma.tags.findMany({
        where: { id: { in: feedback_tag_ids } },
        select: { id: true },
      });

      if (tagReferences.length !== feedback_tag_ids.length) {
        throw new NotFoundException('One or more feedback tags do not exist');
      }

      await this.prisma.tagged_entities.createMany({
        data: feedback_tag_ids.map((feedbackTagId) => ({
          tag_id: feedbackTagId,
          entity_id: feedback.id,
          entity_type: 'feedback',
          reference_id: feedbackTagId, // Self-reference feedback
          reference_type: 'feedback',
        })),
      });
    }

    // Step 4: Associate feedback with other system entities (Ensure tag_id is valid)
    if (tagged_entities.length > 0) {
      const entityTags = await this.prisma.tags.findMany({
        where: { id: { in: tagged_entities.map((te) => te.entity_id) } },
        select: { id: true },
      });

      if (entityTags.length !== tagged_entities.length) {
        throw new NotFoundException('One or more entity tags do not exist');
      }

      await this.prisma.tagged_entities.createMany({
        data: tagged_entities.map(({ entity_id, entity_type }) => ({
          tag_id: entity_id, // Ensuring tag_id is properly set
          entity_id: feedback.id,
          entity_type: 'feedback',
          reference_id: entity_id,
          reference_type: entity_type,
        })),
      });
    }

    return feedback;
  }

  // Update feedback and update associated tags
  async updateFeedback(id: number, dto: UpdateFeedbackDto) {
    const {
      tag_ids = [],
      feedback_tag_ids = [],
      tagged_entities = [],
      ...updateData
    } = dto;

    // Ensure feedback exists
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    // Update feedback details
    const updatedFeedback = await this.prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    // Remove existing tag associations
    await this.prisma.tagged_entities.deleteMany({
      where: { entity_id: id, entity_type: 'feedback' },
    });

    // Re-associate general tags
    if (tag_ids.length > 0) {
      await this.prisma.tagged_entities.createMany({
        data: tag_ids.map((tagId) => ({
          tag_id: tagId,
          entity_id: id,
          entity_type: 'feedback',
        })),
      });
    }

    // Re-associate feedback-to-feedback tagging (Ensure tags exist)
    if (feedback_tag_ids.length > 0) {
      const tagReferences = await this.prisma.tags.findMany({
        where: { id: { in: feedback_tag_ids } },
        select: { id: true },
      });

      if (tagReferences.length !== feedback_tag_ids.length) {
        throw new NotFoundException('One or more feedback tags do not exist');
      }

      await this.prisma.tagged_entities.createMany({
        data: feedback_tag_ids.map((feedbackTagId) => ({
          tag_id: feedbackTagId,
          entity_id: id,
          entity_type: 'feedback',
          reference_id: feedbackTagId,
          reference_type: 'feedback',
        })),
      });
    }

    // Re-associate feedback with other system entities
    if (tagged_entities.length > 0) {
      const entityTags = await this.prisma.tags.findMany({
        where: { id: { in: tagged_entities.map((te) => te.entity_id) } },
        select: { id: true },
      });

      if (entityTags.length !== tagged_entities.length) {
        throw new NotFoundException('One or more entity tags do not exist');
      }

      await this.prisma.tagged_entities.createMany({
        data: tagged_entities.map(({ entity_id, entity_type }) => ({
          tag_id: entity_id,
          entity_id: id,
          entity_type: 'feedback',
          reference_id: entity_id,
          reference_type: entity_type,
        })),
      });
    }

    return updatedFeedback;
  }

  async getAllFeedback() {
    return this.prisma.feedback.findMany({
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async getFeedbackById(id: number) {
    // Step 1: Fetch feedback
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!feedback) throw new NotFoundException('Feedback not found');

    // Step 2: Fetch related tags from `tagged_entities`
    const tags = await this.prisma.tagged_entities.findMany({
      where: {
        entity_id: id,
        entity_type: 'feedback',
      },
      include: {
        tag: true, // Fetch tag details
      },
    });

    // Step 3: Attach tags to feedback response
    return { ...feedback, tags };
  }

  async getUserFeedback(userId: number, type: 'sent' | 'received') {
    const condition =
      type === 'sent' ? { sender_id: userId } : { receiver_id: userId };

    // Step 1: Fetch all feedback entries for the user
    const feedbackList = await this.prisma.feedback.findMany({
      where: condition,
      include: {
        sender: true,
        receiver: true,
      },
    });

    // Step 2: Fetch all tags for the retrieved feedback entries
    const feedbackIds = feedbackList.map((fb) => fb.id);
    const tagData = await this.prisma.tagged_entities.findMany({
      where: {
        entity_id: { in: feedbackIds },
        entity_type: 'feedback',
      },
      include: {
        tag: true,
      },
    });

    // Step 3: Attach tags to each feedback entry
    const feedbackWithTags = feedbackList.map((fb) => ({
      ...fb,
      tags: tagData.filter((tag) => tag.entity_id === fb.id),
    }));

    return feedbackWithTags;
  }

  // Delete feedback with proper tag cleanup
  async deleteFeedback(id: number) {
    await this.prisma.tagged_entities.deleteMany({
      where: { entity_id: id, entity_type: 'feedback' },
    });

    return this.prisma.feedback.delete({ where: { id } });
  }
}
