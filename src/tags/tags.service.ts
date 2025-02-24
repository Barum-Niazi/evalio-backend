import { Injectable } from '@nestjs/common';
import { TagsRepository } from './tags.repository';
import { CreateTagDto, TagEntityDto, UntagEntityDto } from './dto/tags.dto';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepo: TagsRepository) {}

  // Manually create a tag (Admin only)
  async createTag(dto: CreateTagDto) {
    let existingTag = await this.tagsRepo.findTagByName(dto.name);
    if (existingTag) return existingTag;

    return this.tagsRepo.createTag(dto.name, dto.description);
  }

  // Get all available tags
  async getAllTags() {
    return this.tagsRepo.getAllTags();
  }

  // Automatically create a tag when a new entity (Feedback, OKR, etc.) is created
  async autoCreateTagForEntity(dto: TagEntityDto) {
    let existingTag = await this.tagsRepo.findTagByName(dto.entityName);

    if (!existingTag) {
      existingTag = await this.tagsRepo.createTag(
        dto.entityName,
        `Auto-generated tag for ${dto.entityType}`,
      );
    }

    // Link the entity to the created tag
    return this.tagsRepo.tagEntity(dto.entityId, dto.entityType, [
      existingTag.id,
    ]);
  }

  // Tag an entity with existing tags (supports entity references)
  async tagEntity(dto: TagEntityDto) {
    return this.tagsRepo.tagEntity(
      dto.entityId,
      dto.entityType,
      dto.tagIds,
      dto.referenceId, // Reference to another entity (if provided)
      dto.referenceType,
    );
  }

  // Remove specific tags from an entity
  async untagEntity(dto: UntagEntityDto) {
    return this.tagsRepo.untagEntity(dto.entityId, dto.entityType, dto.tagIds);
  }

  // Get all tags linked to an entity
  async getTagsForEntity(entityId: number, entityType: string) {
    return this.tagsRepo.getTagsForEntity(entityId, entityType);
  }

  // Get all entities associated with a specific tag
  async getEntitiesByTag(tagId: number) {
    return this.tagsRepo.getEntitiesByTag(tagId);
  }
}
