// src/company/company.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  Body,
  UploadedFile,
  UseInterceptors,
  Request,
  ForbiddenException,
  Req,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorators';
import { AddEmployeeDto } from './dto/create-employee.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  @UseInterceptors(FileInterceptor('logo'))
  async createCompany(
    @Request() req,
    @Body() createCompanyDto: CreateCompanyDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can create a company');
    }

    const adminId = req.user.id;
    return this.companyService.createCompany(createCompanyDto, adminId, logo);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Get('users')
  async getCompanyUsers(@Req() req) {
    const adminId = req.user.id; // Retrieved from JWT payload
    return this.companyService.getCompanyUsers(adminId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Post('employees/add')
  async addEmployee(@Body() addEmployeeDto: AddEmployeeDto, @Req() req) {
    const adminId = req.user.id; // Retrieved from JWT payload
    return this.companyService.addEmployee(adminId, addEmployeeDto);
  }

  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
      },
      fileFilter: (req, file, callback) => {
        // Allow only Excel or CSV files
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return callback(
            new BadRequestException('Only Excel or CSV files are allowed!'),
            false,
          );
        }
        callback(null, true); // Accept the file
      },
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Post('employees/upload')
  async uploadEmployees(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('File must be provided.');
    }
    const adminId = req.user.id;
    return this.companyService.addEmployeesFromFile(adminId, file);
  }
}
