import { BadRequestException, Injectable, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmployeeRepository } from 'src/employee/employee.repository';
import { EmailService } from 'src/services/email.service';
import * as argon2 from 'argon2';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import * as ExcelJS from 'exceljs';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeeRepository: EmployeeRepository,
    private readonly emailService: EmailService,
  ) {}

  async getEmployees(companyId: number, page = 1, limit?: number) {
    const offset = limit ? (page - 1) * limit : 0;

    const [employees, total] =
      await this.employeeRepository.getEmployeesByCompany(
        companyId,
        offset,
        limit,
      );

    const data = employees.map((emp) => ({
      user_id: emp.user_id,
      name: emp.name,
      email: emp.user?.auth?.email ?? null,
      manager: emp.manager
        ? {
            user_id: emp.manager.user_id,
            name: emp.manager.name,
            profileImage: emp.manager.profile_blob
              ? {
                  id: emp.manager.profile_blob.id,
                  name: emp.manager.profile_blob.name,
                  url: `/blob/${emp.manager.profile_blob.id}/view`,
                }
              : null,
          }
        : null,
      designation: emp.designation,
      department: emp.department,
      profileImage: emp.profile_blob
        ? {
            id: emp.profile_blob.id,
            name: emp.profile_blob.name,
            url: `/blob/${emp.profile_blob.id}/view`,
          }
        : null,
    }));

    return {
      data,
      page,
      limit: limit ?? total,
      total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    };
  }

  async addEmployees(adminId: number, addEmployeeDto: { employees: any[] }) {
    const companyId = await this.employeeRepository.getAdminCompanyId(adminId);

    const employees = await Promise.all(
      addEmployeeDto.employees.map(async (employee) => {
        const { name, email, designation, managerId, departmentId, roles } =
          employee;

        // Generate a set password for now
        const password = '12345678';
        const hashedPassword = await argon2.hash(password);

        // Fetch the company name (for sending welcome email)
        const company = await this.prisma.companies.findUnique({
          where: { id: companyId },
          select: { name: true },
        });

        // Validate department belongs to this company
        if (departmentId) {
          const department = await this.prisma.department.findUnique({
            where: { id: departmentId },
            select: { company_id: true },
          });

          if (!department || department.company_id !== companyId) {
            throw new BadRequestException(
              `Invalid departmentId ${departmentId} for company ${companyId}`,
            );
          }
        }

        return {
          name,
          email,
          designation,
          password: hashedPassword,
          companyId,
          managerId,
          departmentId,
          roles,
          plainPassword: password, // needed for email
          companyName: company?.name,
        };
      }),
    );

    const createdEmployees = await this.prisma.$transaction(
      employees.map((employee) => {
        const {
          name,
          email,
          password,
          designation,
          companyId,
          managerId,
          departmentId,
          roles,
        } = employee;

        return this.employeeRepository.createEmployee({
          name,
          email,
          password,
          designation,
          companyId,
          managerId,
          departmentId,
          roles,
        });
      }),
    );

    // // Send emails after creation
    // await Promise.all(
    //   employees.map(({ name, email, plainPassword, companyName }) =>
    //     this.emailService.sendEmail(
    //       email,
    //       `Welcome to ${companyName}`,
    //       `Hello ${name},
    //       Your account has been created.
    //       Email: ${email}
    //       Password: ${plainPassword}
    //       Please log in and change your password as soon as possible.`,
    //     ),
    //   ),
    // );

    return {
      message: 'Employees added successfully',
      addedEmployees: createdEmployees,
    };
  }

  async updateEmployee(
    employeeId: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeRepository.updateEmployee(
      employeeId,
      updateEmployeeDto,
    );
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
        .on('data', async (row) => {
          const name = row['Name']?.trim();
          const email = row['Email']?.trim();
          const designation = row['Designation']?.trim();
          const managerEmail = row['ManagerEmail']?.trim();
          const rolesRaw = row['Roles']?.trim(); // e.g., "Employee,Manager"

          if (name && email && designation) {
            const password = '12345678'; // Default for now
            const hashedPassword = await argon2.hash(password);

            const roles = rolesRaw
              ? rolesRaw.split(',').map((r) => r.trim())
              : ['Employee'];

            employees.push({
              name,
              email,
              designation,
              hashedPassword,
              companyId,
              managerEmail,
              roles,
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

    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);

      const name = row.getCell(1)?.value?.toString().trim();
      const email = row.getCell(2)?.value?.toString().trim();
      const designation = row.getCell(3)?.value?.toString().trim();
      const managerEmail = row.getCell(4)?.value?.toString().trim();
      const rolesRaw = row.getCell(5)?.value?.toString().trim(); // e.g., "Employee,Manager"

      if (name && email && designation) {
        const password = '12345678';
        const hashedPassword = await argon2.hash(password);

        const roles = rolesRaw
          ? rolesRaw.split(',').map((r) => r.trim())
          : ['Employee'];

        employees.push({
          name,
          email,
          designation,
          hashedPassword,
          companyId,
          managerEmail,
          roles,
        });
      }
    }

    return employees;
  }
  async getEmployeesWithoutDepartment(companyId: number) {
    const employees =
      await this.employeeRepository.getEmployeesWithoutDepartment(companyId);

    return employees.map((emp) => ({
      user_id: emp.user_id,
      name: emp.name,
      email: emp.user?.auth?.email ?? null,
      manager: emp.manager
        ? {
            user_id: emp.manager.user_id,
            name: emp.manager.name,
            profileImage: emp.manager.profile_blob
              ? {
                  id: emp.manager.profile_blob.id,
                  name: emp.manager.profile_blob.name,
                  url: `/blob/${emp.manager.profile_blob.id}/view`,
                }
              : null,
          }
        : null,
      designation: emp.designation,
      department: null, // Explicitly null
      profileImage: emp.profile_blob
        ? {
            id: emp.profile_blob.id,
            name: emp.profile_blob.name,
            url: `/blob/${emp.profile_blob.id}/view`,
          }
        : null,
    }));
  }
}
