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
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateCompanySettingsDto,
} from './dto/company.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorators';
import { RolesGuard } from 'src/guards/roles.guard';
import { Permissions } from 'src/decorators/permissions.decorators';
import { PermissionsGuard } from 'src/guards/permissions.guard';

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
  @Permissions('view_company_data')
  async getCompanyDashboard(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getCompanyStats(companyId);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  updateCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(id, dto);
  }

  @Patch(':id/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  updateCompanySettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.companyService.updateSettings(id, dto);
  }
}
