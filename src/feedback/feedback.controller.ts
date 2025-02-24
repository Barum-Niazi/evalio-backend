import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { FeedbackService } from './feedback.service';
import { Roles } from 'src/decorators/roles.decorators';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';

@Controller('feedback')
@UseGuards(JwtAuthGuard) // Require authentication
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllFeedback() {
    return this.feedbackService.getAllFeedback();
  }

  @Get(':id')
  async getFeedbackById(@Param('id') id: number) {
    return this.feedbackService.getFeedbackById(id);
  }

  @Get('/user/:userId')
  async getUserFeedback(
    @Param('userId') userId: number,
    @Query('type') type?: 'sent' | 'received',
  ) {
    return this.feedbackService.getUserFeedback(userId, type);
  }

  @Patch(':id')
  async updateFeedback(
    @Param('id') id: number,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.updateFeedback(id, updateFeedbackDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async deleteFeedback(@Param('id') id: number) {
    return this.feedbackService.deleteFeedback(id);
  }
}
