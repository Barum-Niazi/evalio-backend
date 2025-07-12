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
  UploadedFile,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateCompanySettingsDto,
} from './dto/company.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorators';
import { RolesGuard } from 'src/guards/roles.guard';
import { Permissions } from 'src/decorators/permissions.decorators';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getCompany(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getCompany(companyId);
  }

  @Get('org-chart')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('Admin')
  async getOrganizationalChart(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getOrganizationalChart(companyId);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('Admin')
  @Permissions('view_company_data')
  async getCompanyDashboard(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getCompanyStats(companyId);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getCompanySettings(@Request() req) {
    const companyId = req.user.companyId;
    return this.companyService.getCompanySettings(companyId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @UseInterceptors(FileInterceptor('logo'))
  async updateCompany(
    @Body() body: any, // skip auto-validation here
    @Request() req,

    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const companyId = req.user.companyId;

    // manually parse metadata JSON string
    if (body.metadata && typeof body.metadata === 'string') {
      try {
        body.metadata = JSON.parse(body.metadata);
      } catch (e) {
        throw new BadRequestException(
          'Invalid metadata format. Must be valid JSON.',
        );
      }
    }

    const dto = plainToInstance(UpdateCompanyDto, body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return this.companyService.updateCompany(companyId, dto, logo);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('manage_company_settings')
  @Roles('Admin')
  updateCompanySettings(@Body() dto: UpdateCompanySettingsDto, @Request() req) {
    const id = req.user.companyId;
    return this.companyService.updateSettings(id, dto);
  }
}
