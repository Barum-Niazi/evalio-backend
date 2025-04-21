import { Body, Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/decorators/roles.decorators';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('view')
  async get() {
    return this.userService.findCompanyUsers(4);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'Employee') // Allow access to Admin and Employee
  @Get('dashboard')
  getDashboard(@Request() req) {
    console.log(req.user.role);
    return {
      message: 'Welcome to the dashboard',
      role: req.user.role,
    };
  }
}
