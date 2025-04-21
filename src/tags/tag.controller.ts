import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/tag.dto';
import { GetTagsDto } from './dto/tag.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
  async getAllTags(@Request() req) {
    return this.tagService.getAllTagsForUser({
      id: req.user.id,
      company_id: req.user.company_id,
    });
  }
}
