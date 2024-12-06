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
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorators';
import { AddEmployeeToDepartmentDto } from './dto/add-employees.dto';

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
    console.log(req.user.companyId, createDepartmentDto.companyId);
    if (
      !req.user.companyId ||
      req.user.companyId !== createDepartmentDto.companyId
    ) {
      throw new ForbiddenException(
        'You can only create departments for your company.',
      );
    }

    return this.departmentService.createDepartment(
      createDepartmentDto.name,
      createDepartmentDto.companyId,
      createDepartmentDto.headId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @Get('company/:companyId')
  async getDepartmentsByCompany(
    @Param('companyId') companyId: number,
    @Request() req,
  ) {
    const adminCompanyId = req.user.companyId;

    if (companyId !== adminCompanyId) {
      throw new ForbiddenException(
        'You can only view departments for your company.',
      );
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
  async addEmployeesToDepartment(
    @Body() addEmployeeToDepartmentDto: AddEmployeeToDepartmentDto,
    @Request() req,
  ) {
    const { departmentId, employeeIds } = addEmployeeToDepartmentDto;

    const adminCompanyId = req.user.companyId;
    const department =
      await this.departmentService.getDepartmentsByCompany(adminCompanyId);
    const departmentExists = department.find((d) => d.id === departmentId);

    if (!departmentExists) {
      throw new ForbiddenException(
        'You do not have access to this department.',
      );
    }

    return this.departmentService.addEmployeesToDepartment(
      departmentId,
      employeeIds,
    );
  }
}
