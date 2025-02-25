import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('feedback')
@UseGuards(JwtAuthGuard) // Requires authentication
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get()
  async getAllFeedback() {
    return this.feedbackService.getAllFeedback();
  }

  @Get(':id')
  async getFeedbackById(@Param('id') id: number) {
    return this.feedbackService.getFeedbackById(Number(id));
  }

  @Patch(':id')
  async updateFeedback(
    @Param('id') id: number,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.updateFeedback(id, updateFeedbackDto);
  }

  //   @Delete(':id')
  //   async deleteFeedback(@Param('id') id: number) {
  //     return this.feedbackService.deleteFeedback(id);
  //   }
}
