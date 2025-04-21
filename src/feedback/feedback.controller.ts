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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { UpdateFeedbackDto } from './dto/feedback.dto';
import { GetFeedbackDto } from './dto/feedback.dto';
import { DeleteFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import {
  CreateFeedbackRequestDto,
  DeclineFeedbackRequestDto,
  GetFeedbackRequestsDto,
  UpdateFeedbackRequestDto,
} from './dto/feedback-request.dto';
import { FeedbackRequestService } from './feedback-request.service';

@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly feedbackRequestService: FeedbackRequestService,
  ) {}

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

  @Get('/user')
  async getFeedbackByEmployeeId(@Request() req) {
    const employeeId = req.user.id;
    return this.feedbackService.getFeedbackbyEmployee(employeeId);
  }

  @Post('/request')
  async createRequest(
    @Request() req,
    @Body() dto: Omit<CreateFeedbackRequestDto, 'requesterId'>,
  ) {
    const requesterId = req.user.id;
    return this.feedbackRequestService.createFeedbackRequest({
      ...dto,
      requesterId,
    });
  }

  @Get('/requests')
  async getRequests(@Request() req, @Query() dto: GetFeedbackRequestsDto) {
    const userId = req.user.id;
    return this.feedbackRequestService.getFeedbackRequestsByUser(
      userId,
      dto.asRequester ?? false,
    );
  }

  @Patch('/request/decline')
  async declineRequest(@Request() req, @Body() dto: DeclineFeedbackRequestDto) {
    return this.feedbackRequestService.declineFeedbackRequest(req.user.id, dto);
  }
}
