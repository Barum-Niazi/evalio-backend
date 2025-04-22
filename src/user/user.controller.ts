import { Body, Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/decorators/roles.decorators';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req) {
    return this.userService.getUserProfile(req.user.id);
  }
}
