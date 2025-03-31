import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { UpdateFeedbackDto } from './dto/feedback.dto';
import { GetFeedbackDto } from './dto/feedback.dto';
import { DeleteFeedbackDto } from './dto/feedback.dto';
import { ListFeedbackDto } from './dto/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * ✅ Create new feedback
   */
  @Post()
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  /**
   * ✅ Fetch a single feedback entry by ID
   */
  @Get('/:feedbackId')
  async getFeedback(@Param() getFeedbackDto: GetFeedbackDto) {
    return this.feedbackService.getFeedback(getFeedbackDto);
  }

  /**
   * ✅ Fetch all feedback with optional filters
   */
  @Get()
  async listFeedback(@Query() listFeedbackDto: ListFeedbackDto) {
    return this.feedbackService.listFeedback(listFeedbackDto);
  }

  /**
   * ✅ Update an existing feedback entry
   */
  @Patch()
  async updateFeedback(@Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.updateFeedback(updateFeedbackDto);
  }

  /**
   * ✅ Delete a feedback entry
   */
  @Delete()
  async deleteFeedback(@Body() deleteFeedbackDto: DeleteFeedbackDto) {
    return this.feedbackService.deleteFeedback(deleteFeedbackDto);
  }
}
