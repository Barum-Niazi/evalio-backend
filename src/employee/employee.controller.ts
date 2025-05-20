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
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Post('add')
  async addEmployees(@Body() addEmployeeDto: AddEmployeeDto, @Request() req) {
    const adminId = req.user.id;
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
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Put('update/:id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const employeeId = parseInt(id, 10);
    return this.employeeService.updateEmployee(employeeId, updateEmployeeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getCompanyUsers(@Request() req) {
    const companyId = req.user.company_id;
    return this.employeeService.getEmployees(companyId);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('no-department')
  async getEmployeesWithoutDepartment(@Request() req) {
    const companyId = req.user.company_id;
    return this.employeeService.getEmployeesWithoutDepartment(companyId);
  }
}
