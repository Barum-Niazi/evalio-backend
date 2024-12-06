import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyRepository } from '../repositories/company.repository';
import { EmployeeRepository } from 'src/repositories/employee.repository';
import { EmailService } from 'src/services/email.service';
import { AddEmployeeDto } from './dto/add-employee.dto';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyRepository: CompanyRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly emailService: EmailService,
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

  async addEmployees(adminId: number, addEmployeeDto: { employees: any[] }) {
    const companyId = await this.companyRepository.getAdminCompanyId(adminId);

    // Validate each employee and prepare for bulk insertion
    const employees = await Promise.all(
      addEmployeeDto.employees.map(async (employee) => {
        const { name, email, designation, managerId } = employee;

        // Generate a random password
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await argon2.hash(password);

        const company = await this.prisma.companies.findUnique({
          where: { id: companyId },
          select: { name: true },
        });

        // Send email with credentials
        await this.emailService.sendEmail(
          email,
          `Welcome to ${company.name}`,
          `Hello ${name},
           Your account has been created.
           Email: ${email}
           Password: ${password}
           Please log in and change your password as soon as possible.`,
        );

        return {
          name,
          email,
          designation,
          password: hashedPassword,
          companyId,
          managerId,
        };
      }),
    );

    const addedEmployees =
      await this.employeeRepository.createManyEmployees(employees);

    return {
      message: 'Employees added successfully',
      addedEmployees,
    };
  }

  async addEmployeesFromFile(adminId: number, file: Express.Multer.File) {
    const startTime = Date.now();
    console.time('file-processing-time');

    console.time('get-company-id-time');
    const companyId = await this.companyRepository.getAdminCompanyId(adminId);
    console.timeEnd('get-company-id-time');

    console.time('excel-load-time');
    const fileStream = Readable.from(file.buffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(fileStream); // Load the Excel file
    console.timeEnd('excel-load-time');

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('No worksheet found in the uploaded file.');
    }

    console.time('row-parsing-time');
    const employees: any[] = [];
    const passwordPromises: Promise<any>[] = [];

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip the header row

      const rowValues = row.values as (string | null)[];
      const name = rowValues[1]?.toString().trim(); // First column
      const email = rowValues[2]?.toString().trim(); // Second column
      const designation = rowValues[3]?.toString().trim(); // Third column
      const managerEmail = rowValues[4]?.toString().trim(); // Fourth column

      if (!name || !email || !designation) {
        console.warn(`Skipping invalid row ${rowIndex}`);
        return; // Skip invalid rows
      }

      const password = Math.random().toString(36).slice(-8);
      passwordPromises.push(
        argon2.hash(password).then((hashedPassword) => {
          employees.push({
            name,
            email,
            designation,
            password: hashedPassword,
            companyId,
            managerEmail,
          });
        }),
      );
    });

    await Promise.all(passwordPromises); // Ensure all passwords are hashed
    console.timeEnd('row-parsing-time');

    if (employees.length === 0) {
      throw new BadRequestException('No valid employees found in the file.');
    }

    console.time('employee-creation-time');
    const result = await this.employeeRepository.createManyEmployees(employees);
    console.timeEnd('employee-creation-time');

    console.timeEnd('file-processing-time');
    console.log('Total file processing time:', Date.now() - startTime, 'ms');

    return {
      message: 'Employees added successfully',
      added: result.length,
    };
  }
}
