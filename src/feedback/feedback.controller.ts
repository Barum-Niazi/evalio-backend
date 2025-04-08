import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { UpdateFeedbackDto } from './dto/feedback.dto';
import { GetFeedbackDto } from './dto/feedback.dto';
import { DeleteFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get('/id/:feedbackId')
  async getFeedback(@Param('feedbackId') feedbackId: number) {
    const getFeedbackDto = new GetFeedbackDto();
    // cast feedbackid as an integer
    getFeedbackDto.feedbackId = parseInt(feedbackId.toString(), 10);
    return this.feedbackService.getFeedback(getFeedbackDto);
  }

  @Patch()
  async updateFeedback(@Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.updateFeedback(updateFeedbackDto);
  }

  @Delete()
  async deleteFeedback(@Body() deleteFeedbackDto: DeleteFeedbackDto) {
    return this.feedbackService.deleteFeedback(deleteFeedbackDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  async getFeedbackByEmployeeId(@Request() req) {
    const employeeId = req.user.id;
    return this.feedbackService.getFeedbackbyEmployee(employeeId);
  }
}
