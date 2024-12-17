import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmployeeRepository } from 'src/employee/employee.repository';
import { EmailService } from 'src/services/email.service';
import * as argon2 from 'argon2';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import * as ExcelJS from 'exceljs';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeeRepository: EmployeeRepository,
    private readonly emailService: EmailService,
  ) {}

  async getEmployees(companyId: number) {
    return this.employeeRepository.getEmployeesByCompany(companyId);
  }
  async addEmployees(adminId: number, addEmployeeDto: { employees: any[] }) {
    const companyId = await this.employeeRepository.getAdminCompanyId(adminId);

    const employees = await Promise.all(
      addEmployeeDto.employees.map(async (employee) => {
        const { name, email, designation, managerId } = employee;

        // Generate a random password
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await argon2.hash(password);

        // Fetch the company name (optional, for sending welcome email)
        const company = await this.prisma.companies.findUnique({
          where: { id: companyId },
          select: { name: true },
        });

        return {
          name,
          email,
          designation,
          password: hashedPassword,
          companyId,
          managerId,
          companyName: company?.name,
        };
      }),
    );

    // Insert all employees within a transaction
    const createdEmployees = await this.prisma.$transaction(
      employees.map((employee) => {
        const { name, email, password, designation, companyId, managerId } =
          employee;

        return this.employeeRepository.createEmployee({
          name,
          email,
          password,
          designation,
          companyId,
          managerId,
        });
      }),
    );

    // // Send email with credentials
    // await this.emailService.sendEmail(
    //   email,
    //   `Welcome to ${company.name}`,
    //   `Hello ${name},
    //    Your account has been created.
    //    Email: ${email}
    //    Password: ${password}
    //    Please log in and change your password as soon as possible.`,
    // );
    // Return a response indicating success
    return {
      message: 'Employees added successfully',
      addedEmployees: createdEmployees,
    };
  }

  async addEmployeesFromFile(adminId: number, file: Express.Multer.File) {
    const startTime = Date.now();
    console.time('file-processing-time');

    const companyId = await this.employeeRepository.getAdminCompanyId(adminId);
    if (!companyId) {
      throw new BadRequestException('Invalid admin company association.');
    }

    const fileStream = Readable.from(file.buffer);

    let employees: any[] = [];

    if (file.originalname.match(/\.(csv)$/)) {
      console.time('csv-parsing-time');
      employees = await this.parseCSVFile(fileStream, companyId);
      console.timeEnd('csv-parsing-time');
    } else if (file.originalname.match(/\.(xlsx|xls)$/)) {
      console.time('excel-parsing-time');
      employees = await this.parseExcelFile(fileStream, companyId);
      console.timeEnd('excel-parsing-time');
    } else {
      throw new BadRequestException('Unsupported file format.');
    }

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

  private async parseCSVFile(
    fileStream: Readable,
    companyId: number,
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const employees: any[] = [];

      fileStream
        .pipe(csvParser())
        .on('data', (row) => {
          const name = row['Name']?.trim();
          const email = row['Email']?.trim();
          const designation = row['Designation']?.trim();
          const managerEmail = row['ManagerEmail']?.trim();

          if (name && email && designation) {
            const password = Math.random().toString(36).slice(-8);
            employees.push({
              name,
              email,
              designation,
              password,
              companyId,
              managerEmail,
            });
          }
        })
        .on('end', () => resolve(employees))
        .on('error', (error) => reject(error));
    });
  }

  private async parseExcelFile(
    fileStream: Readable,
    companyId: number,
  ): Promise<any[]> {
    const employees: any[] = [];
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(fileStream);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('No worksheet found in the uploaded file.');
    }

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip the header row

      const name = row.getCell(1)?.value?.toString().trim();
      const email = row.getCell(2)?.value?.toString().trim();
      const designation = row.getCell(3)?.value?.toString().trim();
      const managerEmail = row.getCell(4)?.value?.toString().trim();

      if (name && email && designation) {
        const password = Math.random().toString(36).slice(-8);
        employees.push({
          name,
          email,
          designation,
          password,
          companyId,
          managerEmail,
        });
      }
    });

    return employees;
  }
}
