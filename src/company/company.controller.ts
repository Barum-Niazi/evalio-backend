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
  UploadedFiles,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorators';
import { AddEmployeeDto } from './dto/add-employee.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Allow up to 10 files
      limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB per file
      },
      fileFilter: (req, file, callback) => {
        // Allow only Excel, CSV, PNG, JPG, and JPEG files
        if (!file.originalname.match(/\.(xlsx|xls|csv|png|jpg|jpeg)$/)) {
          return callback(
            new BadRequestException(
              'Only Excel, CSV, PNG, JPG, and JPEG files are allowed!',
            ),
            false,
          );
        }
        callback(null, true); // Accept the file
      },
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createCompany(
    @Request() req,
    @Body() createCompanyDto: CreateCompanyDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const adminId = req.user.id;

    // Separate logo and employee file
    const logo = files?.find((file) => file.mimetype.startsWith('image/'));
    const employeesFile = files?.find((file) =>
      file.originalname.match(/\.(xlsx|xls|csv)$/),
    );

    return this.companyService.createCompany(
      createCompanyDto,
      adminId,
      logo,
      employeesFile,
    );
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
  async addEmployees(@Body() addEmployeeDto: AddEmployeeDto, @Request() req) {
    const adminId = req.user.id; // Retrieved from JWT payload
    return this.companyService.addEmployees(adminId, addEmployeeDto);
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

  @Get('org-chart')
  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  async getOrganizationalChart(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getOrganizationalChart(companyId);
  }
}
