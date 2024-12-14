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
    // if (
    //   !req.user.companyId ||
    //   req.user.companyId !== createDepartmentDto.companyId
    // ) {
    //   throw new ForbiddenException(
    //     'You can only create departments for your company.',
    //   );
    // }
    // companyId = req.user.companyId; // Hardcoded for now

    return this.departmentService.createDepartment(
      createDepartmentDto.name,
      req.user.companyId,
      createDepartmentDto.headId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
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
    @Body() addEmployeesToDepartmentsDto: AddEmployeesToDepartmentsDto,
    @Request() req,
  ) {
    const adminCompanyId = req.user.companyId;

    const results = [];
    for (const department of addEmployeesToDepartmentsDto.departments) {
      const { departmentId, employeeEmails } = department;

      const departmentExists =
        await this.departmentService.getDepartmentsByCompany(adminCompanyId);
      const validDepartment = departmentExists.find(
        (d) => d.id === departmentId,
      );

      if (!validDepartment) {
        throw new ForbiddenException(
          `You do not have access to department ID ${departmentId}.`,
        );
      }

      // Fetch user IDs based on provided emails
      const employeeIds =
        await this.departmentService.getUserIdsByEmails(employeeEmails);

      if (employeeIds.length !== employeeEmails.length) {
        throw new BadRequestException(
          `Some provided emails do not exist or are invalid.`,
        );
      }

      // Add employees to the department
      const result = await this.departmentService.addEmployeesToDepartment(
        departmentId,
        employeeIds,
      );
      results.push({ departmentId, addedEmployees: result });
    }

    return results;
  }
}
