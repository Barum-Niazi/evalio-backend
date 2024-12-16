// src/company/company.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  Body,
  UseInterceptors,
  Request,
  BadRequestException,
  Get,
  UploadedFiles,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorators';

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

  @Get('org-chart')
  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  async getOrganizationalChart(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getOrganizationalChart(companyId);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  async getCompanyDashboard(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getCompanyStats(companyId);
  }
}
