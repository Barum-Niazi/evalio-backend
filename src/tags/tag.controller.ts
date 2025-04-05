import { Controller, Post, Get, Body, Param } from '@nestjs/common';
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
  async getTagsForEntity(@Param() getTagsDto: GetTagsDto) {
    return this.tagService.getTagsForEntity(getTagsDto);
  }

  @Get()
  async getAllTags() {
    return this.tagService.getAllTags();
  }
}
