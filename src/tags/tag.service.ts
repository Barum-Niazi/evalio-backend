import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { CreateTagDto } from './dto/tag.dto';
import { UntagEntityDto } from './dto/tag.dto';
import { GetTagsDto } from './dto/tag.dto';
import { FeedbackRepository } from 'src/feedback/feedback.repository';
import { filterAndFormatFeedbacks } from 'src/feedback/feedback.utils';

@Injectable()
export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async createTag(createTagDto: CreateTagDto) {
    const existingTag = await this.tagRepository.findTagByName(
      createTagDto.name,
    );

    if (existingTag) {
      throw new BadRequestException('Tag already exists');
    }

    return this.tagRepository.createTag(
      createTagDto.name,
      createTagDto.description,
    );
  }

  async createTagforEntities(
    name: string,
    description?: string,
    parentId?: number,
    parentType?: string,
  ) {
    const existingTag = await this.tagRepository.findTagByName(name);

    if (existingTag) {
      throw new BadRequestException('Tag already exists');
    }
    return this.tagRepository.createTagforEntities(
      name,
      description,
      parentId,
      parentType,
    );
  }

  async tagEntity(
    tagTitles: string[],
    entityId: number,
    entityType: string,
    referenceId: number,
    referenceType: string,
  ) {
    if (!tagTitles || tagTitles.length === 0) {
      throw new BadRequestException('At least one tag must be provided');
    }

    // Step 1: Fetch existing tags based on their titles
    let tagEntities = await this.tagRepository.findTagsByTitles(tagTitles);

    // Step 2: Find tags that don't exist
    const existingTagTitles = tagEntities.map((tag) => tag.name);
    const missingTagTitles = tagTitles.filter(
      (tag) => !existingTagTitles.includes(tag),
    );

    // Step 3: If some tags are missing, create them
    if (missingTagTitles.length > 0) {
      for (const tagTitle of missingTagTitles) {
        // Create missing tag (you can add a description if needed)
        const createTagDto: CreateTagDto = {
          name: tagTitle,
          description: 'Auto-generated tag', // or a custom description
        };
        await this.createTag(createTagDto); // This will create the tag and handle uniqueness checks
      }

      // Step 4: Re-fetch the tags, as new ones might have been created
      tagEntities = await this.tagRepository.findTagsByTitles(tagTitles);
    }

    // Step 4: Map the tags to their IDs
    const tagIds = tagEntities.map((tag) => tag.id);

    // Step 5: Associate tags with the entity
    return this.tagRepository.tagEntityWithTags(
      tagIds,
      entityId,
      entityType,
      referenceId,
      referenceType,
    );
  }

  async untagEntity(untagEntityDto: UntagEntityDto) {
    if (!untagEntityDto.tagIds || untagEntityDto.tagIds.length === 0) {
      throw new BadRequestException(
        'At least one tag must be provided for removal',
      );
    }

    return this.tagRepository.untagEntity(
      untagEntityDto.tagIds,
      untagEntityDto.entityId,
      untagEntityDto.entityType,
    );
  }

  async getTagsForEntity(getTagsDto: GetTagsDto) {
    return this.tagRepository.getTagsForEntity(
      getTagsDto.entityId,
      getTagsDto.entityType,
    );
  }

  async getAllTagsForUser(currentUser: { id: number; companyId: number }) {
    // 1. Fetch all visible feedbacks
    const feedbacks =
      await this.feedbackRepository.getAllFeedbackWithVisibility();
    const visibleFeedbacks = filterAndFormatFeedbacks(feedbacks, currentUser);
    const visibleFeedbackIds = visibleFeedbacks.map((fb) => fb.id);

    // 2. Get tags from visible feedbacks
    const entityTags = await this.tagRepository.getTagsByEntityIds(
      visibleFeedbackIds,
      'FEEDBACK',
    );

    // 3. Get global (unlinked) tags
    const generalTags = await this.tagRepository.getGeneralTags();

    return [...generalTags, ...entityTags];
  }
}
