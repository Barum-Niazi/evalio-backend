import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @UseGuards(JwtAuthGuard)
  @Get('members')
  async getTeamMembers(@Req() req) {
    const userId = req.user.id; // assuming user id is here from JWT payload
    return this.teamService.getTeamMembers(userId);
  }
}
