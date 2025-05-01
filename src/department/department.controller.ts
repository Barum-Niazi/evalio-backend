import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorators';
import { AddEmployeesToDepartmentsDto } from './dto/add-employees.dto';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Post('create')
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Request() req,
  ) {
    return this.departmentService.createDepartment(
      createDepartmentDto.name,
      req.user.companyId,
      createDepartmentDto.headId,
    );
  }

  @UseGuards(JwtAuthGuard)
  // @Roles('Admin')
  @Get('all')
  async getAllDepartments(@Request() req) {
    const companyId = req.user.companyId;
    // const companyId = 1; // Hardcoded for
    if (!companyId) {
      throw new ForbiddenException('You are not associated with a company.');
    }

    return this.departmentService.getDepartmentsByCompany(companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Put(':id')
  async updateDepartment(
    @Param('id') id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.updateDepartment(id, {
      name: updateDepartmentDto.name,
      headId: updateDepartmentDto.headId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Delete(':id')
  async deleteDepartment(@Param('id') id: number) {
    return this.departmentService.deleteDepartment(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Post('add-employees')
  async addEmployeesToDepartments(
    @Body() dto: AddEmployeesToDepartmentsDto,
    @Request() req,
  ) {
    const adminCompanyId = req.user.companyId;
    return this.departmentService.addEmployeesToDepartments(
      dto,
      adminCompanyId,
    );
  }
}
