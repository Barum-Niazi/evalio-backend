import {
  Controller,
  Post,
  UseGuards,
  Body,
  UploadedFile,
  UseInterceptors,
  Request,
  BadRequestException,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post('add')
  async addEmployees(@Body() addEmployeeDto: AddEmployeeDto, @Request() req) {
    const adminId = req.user.id;
    console.log('Adding employees:', addEmployeeDto);
    return this.employeeService.addEmployees(adminId, addEmployeeDto);
  }

  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return callback(
            new BadRequestException('Only Excel or CSV files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post('upload')
  async uploadEmployees(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('File must be provided.');
    }
    const adminId = req.user.id;
    return this.employeeService.addEmployeesFromFile(adminId, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Put('update/:id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const employeeId = parseInt(id, 10);
    return this.employeeService.updateEmployee(employeeId, updateEmployeeDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('list')
  async getCompanyUsers(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('all') all?: string,
  ) {
    const companyId = req.user.companyId;

    const isAll = all === 'true';

    const pageNum = isAll ? 1 : parseInt(page, 10) || 1;
    const limitNum = isAll ? undefined : parseInt(limit, 10) || 25;

    return this.employeeService.getEmployees(companyId, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('no-department')
  async getEmployeesWithoutDepartment(@Request() req) {
    const companyId = req.user.companyId;
    return this.employeeService.getEmployeesWithoutDepartment(companyId);
  }
}
