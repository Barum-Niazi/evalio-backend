import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Roles } from 'src/decorators/roles.decorators';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('view')
  async get() {
    return this.userService.findCompanyUsers(4);
  }

  @Post('add')
  async addEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    const { name, email, password, companyId } = createEmployeeDto;
    return this.userService.createEmployee(name, email, password, companyId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'Employee') // Allow access to Admin and Employee
  @Get('dashboard')
  getDashboard(@Request() req) {
    console.log(req.user.role);
    return {
      message: 'Welcome to the dashboard',
      role: req.user.role, // Retrieved from the JWT payload
    };
  }
}
