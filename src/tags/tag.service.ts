import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { CreateTagDto } from './dto/tag.dto';
import { TagEntityDto } from './dto/tag.dto';
import { UntagEntityDto } from './dto/tag.dto';
import { GetTagsDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

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
  ) {
    const existingTag = await this.tagRepository.findTagByName(name);

    if (existingTag) {
      throw new BadRequestException('Tag already exists');
    }
    return this.tagRepository.createTagforEntities(name, description, parentId);
  }

  // async autoCreateTagForEntity() {
  //   let tag = await this.tagRepository.findTagByName();

  //   if (!tag) {
  //     tag = await this.tagRepository.createTag(
  //       autoCreateTagDto.entityName,
  //       null,
  //     );
  //   }

  //   return this.tagRepository.linkTagToEntity(
  //     tag.id,
  //     autoCreateTagDto.entityId,
  //     autoCreateTagDto.entityType,
  //     autoCreateTagDto.referenceId,
  //     autoCreateTagDto.referenceType,
  //   );
  // }

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

  async getAllTags() {
    return this.tagRepository.getAllTags();
  }
}
