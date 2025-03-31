import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { CreateTagDto } from './dto/tag.dto';
import { AutoCreateTagDto } from './dto/tag.dto';
import { TagEntityDto } from './dto/tag.dto';
import { UntagEntityDto } from './dto/tag.dto';
import { GetTagsDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * ✅ Manually create a tag.
   */
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

  /**
   * ✅ Auto-create a tag when an entity is created.
   * Ensures the entity's name is stored as a tag and links the entity in `tagged_entities`.
   */
  async autoCreateTagForEntity(autoCreateTagDto: AutoCreateTagDto) {
    let tag = await this.tagRepository.findTagByName(
      autoCreateTagDto.entityName,
    );

    if (!tag) {
      tag = await this.tagRepository.createTag(
        autoCreateTagDto.entityName,
        null,
      );
    }

    return this.tagRepository.linkTagToEntity(
      tag.id,
      autoCreateTagDto.entityId,
      autoCreateTagDto.entityType,
      autoCreateTagDto.referenceId,
      autoCreateTagDto.referenceType,
    );
  }

  /**
   * ✅ Link existing tags to an entity.
   */
  async tagEntity(tagEntityDto: TagEntityDto) {
    if (!tagEntityDto.tagIds || tagEntityDto.tagIds.length === 0) {
      throw new BadRequestException('At least one tag must be provided');
    }

    return this.tagRepository.tagEntityWithTags(
      tagEntityDto.tagIds,
      tagEntityDto.entityId,
      tagEntityDto.entityType,
      tagEntityDto.referenceId,
      tagEntityDto.referenceType,
    );
  }

  /**
   * ✅ Remove tags from an entity.
   */
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

  /**
   * ✅ Retrieve all tags associated with a specific entity.
   */
  async getTagsForEntity(getTagsDto: GetTagsDto) {
    return this.tagRepository.getTagsForEntity(
      getTagsDto.entityId,
      getTagsDto.entityType,
    );
  }

  /**
   * ✅ Retrieve all tags in the system.
   */
  async getAllTags() {
    return this.tagRepository.getAllTags();
  }
}
