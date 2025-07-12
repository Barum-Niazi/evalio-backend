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
import {
  CreateFeedbackDto,
  ListAccessibleFeedbackDto,
} from './dto/feedback.dto';
import { UpdateFeedbackDto } from './dto/feedback.dto';
import { GetFeedbackDto } from './dto/feedback.dto';
import { DeleteFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import {
  CreateFeedbackRequestDto,
  DeclineFeedbackRequestDto,
  GetFeedbackRequestsDto,
  RespondToFeedbackRequestDto,
  UpdateFeedbackRequestDto,
} from './dto/feedback-request.dto';
import { FeedbackRequestService } from './feedback-request.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorators';

@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly feedbackRequestService: FeedbackRequestService,
  ) {}

  @Post()
  async createFeedback(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Request() req,
  ) {
    // Set the senderId to the authenticated user's ID
    createFeedbackDto.senderId = req.user.id;
    return this.feedbackService.createFeedback(createFeedbackDto);
  }

  @Get('/user/:userId')
  async getFeedbackByUser(@Param('userId') userId: number, @Request() req) {
    userId = parseInt(userId.toString(), 10);
    console.log(userId);
    const companyId = req.user.companyId;
    return this.feedbackService.getFeedbackByUser(userId, companyId);
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

  @Get('/accessible')
  async getAccessibleFeedback(
    @Request() req,
    @Query() query: ListAccessibleFeedbackDto,
  ) {
    return this.feedbackService.getFeedbackbyEmployee(
      {
        id: req.user.id,
        companyId: req.user.companyId,
      },
      query,
    );
  }
  @Get('/summary')
  getFeedbackSummary(
    @Request() req,
    @Query('scope') scope: 'visible' | 'company' = 'visible',
  ) {
    return scope === 'company'
      ? this.feedbackService.getFeedbackSummary(req.user.companyId)
      : this.feedbackService.getVisibleFeedbackSummary({
          id: req.user.id,
          companyId: req.user.companyId,
        });
  }

  @Get('/tags/top')
  getTopTags(
    @Request() req,
    @Query('scope') scope: 'visible' | 'company' = 'visible',
  ) {
    if (scope === 'company') {
      return this.feedbackService.getTopTagsForCompany(req.user.companyId);
    } else {
      return this.feedbackService.getTopTagsVisibleToUser(req.user);
    }
  }

  @Get('engagement')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getFeedbackEngagement(@Request() req) {
    return this.feedbackService.getFeedbackEngagement(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('top-givers')
  getTopFeedbackGivers(@Request() req) {
    return this.feedbackService.getTopFeedbackGivers(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('by-department')
  getFeedbackByDepartment(@Request() req) {
    return this.feedbackService.getFeedbackByDepartment(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('disengaged-users')
  getDisengagedUsers(@Request() req) {
    return this.feedbackService.getDisengagedUsers(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('anonymous-count')
  getAnonymousFeedbackCount(@Request() req) {
    return this.feedbackService.getAnonymousFeedbackCount(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('never-received')
  getUsersNeverReceivedFeedback(@Request() req) {
    return this.feedbackService.getUsersNeverReceivedFeedback(
      req.user.companyId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('never-given')
  getUsersNeverGivenFeedback(@Request() req) {
    return this.feedbackService.getUsersNeverGivenFeedback(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('top-receivers-month')
  getTopReceiversThisMonth(@Request() req) {
    return this.feedbackService.getTopReceiversThisMonth(req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('negative-sentiment-count')
  getNegativeSentimentCount(@Request() req) {
    return this.feedbackService.getNegativeSentimentCount(req.user.companyId);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('weekly-received')
  getFeedbacksReceivedThisWeek(@Request() req) {
    return this.feedbackService.getFeedbacksReceivedThisWeek(
      req.user.companyId,
    );
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

  @Post('/request/respond')
  respond(@Body() dto: RespondToFeedbackRequestDto, @Request() req) {
    return this.feedbackRequestService.respondToFeedbackRequest(
      req.user.id,
      dto,
    );
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
