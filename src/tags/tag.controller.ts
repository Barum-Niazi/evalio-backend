import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/tag.dto';
import { GetTagsDto } from './dto/tag.dto';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  async createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagService.createTag(createTagDto);
  }
  @Get('/:entityType/:entityId')
  async getTagsForEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number, // Use ParseIntPipe here
  ) {
    const getTagsDto: GetTagsDto = {
      entityId,
      entityType: entityType.toUpperCase(),
    };
    return this.tagService.getTagsForEntity(getTagsDto);
  }
  @Get()
  async getAllTags() {
    return this.tagService.getAllTags();
  }
}
