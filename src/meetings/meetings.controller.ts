import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { MeetingService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meetings.dto';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from 'src/decorators/permissions.decorators';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Permissions('create_meeting')
  @Post()
  async create(@Body() dto: CreateMeetingDto, @Request() req) {
    console.log(req);
    const userId = req.user.id;
    console.log('Creating meeting for user:', userId);
    return this.meetingService.createMeeting(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyMeetings(@Request() req) {
    const userId = req.user.id;
    console.log('Fetching meetings for user:', userId);
    return this.meetingService.getMeetingsForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('participation')
  async getMeetingParticipationReport(
    @Query('team') team: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const includeTeam = team === 'true';
    return this.meetingService.getParticipationReport(userId, includeTeam);
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMeetingById(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    console.log('Fetching meeting by ID:', id, 'for user:', userId);
    return this.meetingService.getMeetingById(+id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateMeeting(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.meetingService.updateMeeting(+id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Permissions('delete_meeting')
  @Delete(':id')
  async deleteMeeting(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.meetingService.deleteMeeting(+id, userId);
  }
}
