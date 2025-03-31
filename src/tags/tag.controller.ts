import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/tag.dto';
import { AutoCreateTagDto } from './dto/tag.dto';
import { GetTagsDto } from './dto/tag.dto';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /**
   * ✅ Manually create a tag.
   */
  @Post()
  async createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagService.createTag(createTagDto);
  }

  /**
   * ✅ Auto-create a tag from an entity (Feedback, OKR, Meeting, etc.)
   * Stores a reference in `tagged_entities` for traceability.
   */
  @Post('/auto')
  async autoCreateTag(@Body() autoCreateTagDto: AutoCreateTagDto) {
    return this.tagService.autoCreateTagForEntity(autoCreateTagDto);
  }

  /**
   * ✅ Fetch all tags associated with a specific entity.
   */
  @Get('/:entityType/:entityId')
  async getTagsForEntity(@Param() getTagsDto: GetTagsDto) {
    return this.tagService.getTagsForEntity(getTagsDto);
  }

  /**
   * ✅ Fetch all tags in the system.
   */
  @Get()
  async getAllTags() {
    return this.tagService.getAllTags();
  }
}
