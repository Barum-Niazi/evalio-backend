import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { MeetingService } from './meetings.service';
import { CreateMeetingDto } from './dto/meetings.dto';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateMeetingDto, @Request() req) {
    console.log(req);
    const userId = req.user.id; // assuming `req.user` has userId
    console.log('Creating meeting for user:', userId);
    return this.meetingService.createMeeting(dto, userId);
  }

  @Get()
  async getMyMeetings(@Request() req) {
    const userId = req.user.id;
    return this.meetingService.getMeetingsForUser(userId);
  }

  @Put(':id')
  async updateMeeting(
    @Param('id') id: number,
    @Body() dto: UpdateMeetingDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.meetingService.updateMeeting(id, dto, userId);
  }
}
