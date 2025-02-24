import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, TagEntityDto, UntagEntityDto } from './dto/tags.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard) // Requires authentication for all endpoints
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // Manually create a tag (optional, mostly automated)
  @Post()
  async createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.createTag(createTagDto);
  }

  // Get all tags
  @Get()
  async getAllTags() {
    return this.tagsService.getAllTags();
  }

  // Auto-create a tag for an entity when it's created
  @Post('/auto-tag-entity')
  async autoCreateTagForEntity(@Body() tagEntityDto: TagEntityDto) {
    return this.tagsService.autoCreateTagForEntity(tagEntityDto);
  }

  // Tag an entity with existing tags (supports entity references)
  @Post('/tag-entity')
  async tagEntity(@Body() tagEntityDto: TagEntityDto) {
    return this.tagsService.tagEntity(tagEntityDto);
  }

  // Remove tags from an entity
  @Delete('/untag-entity')
  async untagEntity(@Body() untagEntityDto: UntagEntityDto) {
    return this.tagsService.untagEntity(untagEntityDto);
  }

  // Get all tags for a specific entity
  @Get('/entity-tags/:entityId')
  async getTagsForEntity(
    @Param('entityId') entityId: number,
    @Query('entityType') entityType: string,
  ) {
    return this.tagsService.getTagsForEntity(entityId, entityType);
  }

  // Get all entities tagged with a specific tag
  @Get('/tagged-entities/:tagId')
  async getEntitiesByTag(@Param('tagId') tagId: number) {
    return this.tagsService.getEntitiesByTag(tagId);
  }
}
