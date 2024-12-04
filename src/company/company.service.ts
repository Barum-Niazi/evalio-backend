import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyRepository } from '../repositories/company.repository';
import { EmployeeRepository } from 'src/repositories/employee.repository';
import { AddEmployeeDto } from './dto/create-employee.dto';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyRepository: CompanyRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async createCompany(
    createCompanyDto: CreateCompanyDto,
    adminId: number,
    logo?: Express.Multer.File,
  ) {
    const { name, description, address } = createCompanyDto;

    const company = await this.companyRepository.createCompanyWithLogo(
      adminId,
      { name, description, address },
      logo,
    );

    return {
      message: 'Company created successfully',
      company,
    };
  }

  async getCompanyUsers(adminId: number) {
    const companyId = await this.companyRepository.getAdminCompanyId(adminId);
    return this.companyRepository.getUsersByCompany(companyId);
  }

  async addEmployee(adminId: number, addEmployeeDto: AddEmployeeDto) {
    const { name, email, designation, managerId } = addEmployeeDto;

    const companyId = await this.companyRepository.getAdminCompanyId(adminId);

    // Generate a random password
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await argon2.hash(password);

    // Add the employee
    const employee = await this.employeeRepository.createEmployee({
      name,
      email,
      designation,
      password: hashedPassword,
      companyId: companyId,
      managerId,
    });

    // In a real app, send an email to the employee with their credentials

    return {
      message: 'Employee added successfully',
      employee,
    };
  }

  async addEmployeesFromFile(adminId: number, file: Express.Multer.File) {
    const companyId = await this.companyRepository.getAdminCompanyId(adminId);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('No worksheet found in the uploaded file.');
    }

    const employees = [];
    const rowCount = worksheet.rowCount;

    for (let rowIndex = 2; rowIndex <= rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const name = row.getCell(1).value?.toString().trim(); // First column
      const email = row.getCell(2).value?.toString().trim(); // Second column
      const designation = row.getCell(3).value?.toString().trim(); // Third column
      const managerEmail = row.getCell(4)?.value?.toString().trim(); // Fourth column

      if (!name || !email || !designation) {
        console.warn(`Skipping invalid row ${rowIndex}`);
        continue; // Skip invalid rows
      }

      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await argon2.hash(password); // Hash password asynchronously

      employees.push({
        name,
        email,
        designation,
        password: hashedPassword,
        companyId,
        managerEmail,
      });
    }

    if (employees.length === 0) {
      throw new BadRequestException('No valid employees found in the file.');
    }

    const result = await this.employeeRepository.createManyEmployees(employees);

    return {
      message: 'Employees added successfully',
      added: result.length,
    };
  }
}
