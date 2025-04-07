import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyRepository } from './company.repository';
import { EmployeeRepository } from 'src/employee/employee.repository';
import { EmailService } from 'src/services/email.service';
import * as argon2 from 'argon2';
import * as ExcelJS from 'exceljs';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';
import { DepartmentRepository } from 'src/department/department.repository';

@Injectable()
export class CompanyService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly emailService: EmailService,
  ) {}

  async createCompany(
    createCompanyDto: CreateCompanyDto,
    adminId: number,
    logo?: Express.Multer.File,
    employeesFile?: Express.Multer.File,
  ) {
    const { name, description, address } = createCompanyDto;

    // Step 1: Create the company
    const company = await this.companyRepository.createCompanyWithLogo(
      adminId,
      { name, description, address },
      logo,
    );

    if (!employeesFile) {
      return {
        message: 'Company created successfully without employee data.',
        company,
      };
    }

    // Step 2: Parse the file for employees and departments
    const { employees, departments } = await this.parseInitialSetupFile(
      employeesFile,
      company.id,
    );

    for (let employee of employees) {
      const password = '12345678'; // Default password for now
      try {
        employee.password = await argon2.hash(password); // Hash the password and assign it
      } catch (err) {
        console.error(
          'Error hashing password for employee:',
          employee.email,
          err,
        );
        throw new BadRequestException('Error hashing employee password.');
      }
    }
    // Step 3: Create employees in the database
    const createdEmployees =
      await this.employeeRepository.createManyEmployees(employees);

    // Step 4: Fetch email-to-user_id mapping
    const emailToUserId: Record<string, number> = {};
    createdEmployees.createdEmployees.forEach((employee) => {
      const email = employee.email?.trim().toLowerCase(); // Normalize email
      if (email) {
        emailToUserId[email] = employee.user_id; // Store in the object
      }
    });

    console.log('Email to User ID mapping:', emailToUserId);

    // Step 5: Create or update departments with resolved head and employee IDs
    for (const department of departments) {
      const normalizedDepartmentName = department.name.trim().toLowerCase();
      const headId = department.headEmail
        ? emailToUserId[department.headEmail.trim().toLowerCase()] || null
        : null;
      console.log(`Department head email: ${department.headEmail}`);

      const employeeIds = employees
        .filter((emp) => {
          // Ensure departmentName exists before accessing .trim()
          if (emp.departmentName && emp.email) {
            return (
              emp.departmentName.trim().toLowerCase() ===
              normalizedDepartmentName
            );
          }
          return false; // Skip undefined or null departmentName/email
        })
        .map((emp) => emailToUserId[emp.email.trim().toLowerCase()])
        .filter((id) => id !== undefined); // Remove undefined IDs
      console.log(`Employees assigned to ${department.name}:`, employeeIds);

      if (employeeIds.length === 0) {
        console.warn(
          `No employees to assign to department: ${department.name}`,
        );
      }

      await this.departmentRepository.createOrUpdateDepartment(
        department.name,
        company.id,
        headId,
        employeeIds, // Pass resolved user IDs
      );
    }

    return {
      message:
        'Company and associated employees and departments created successfully.',
      company,
    };
  }

  async getCompanyStats(adminId: number) {
    const companyId = await this.companyRepository.getAdminCompanyId(adminId);
    const data = await this.companyRepository.getCompanyStats(companyId);

    return data;
  }

  async getOrganizationalChart(companyId: number) {
    const employees =
      await this.companyRepository.getOrganizationalData(companyId);

    // Group employees by their `manager_id`
    const groupedByManager = employees.reduce((acc, employee) => {
      const managerId = employee.manager_id || null; // null for top-level nodes
      if (!acc[managerId]) {
        acc[managerId] = [];
      }
      acc[managerId].push(employee);
      return acc;
    }, {});

    // Recursive function to build the hierarchy
    const buildHierarchy = (managerId: number | null) => {
      return (groupedByManager[managerId] || []).map((employee) => ({
        id: employee.user_id,
        name: employee.name,
        designation: employee.designation?.title || 'N/A',
        department: employee.department?.name || 'Unassigned',
        subordinates: buildHierarchy(employee.user_id), // Recursively add subordinates
      }));
    };

    // Build hierarchy starting from employees with no manager
    const hierarchy = buildHierarchy(null);

    return {
      companyId,
      hierarchy,
    };
  }

  private async parseInitialSetupFile(
    file: Express.Multer.File,
    companyId: number,
  ): Promise<{ employees: any[]; departments: any[] }> {
    const employees: any[] = [];
    const departments: Map<string, { name: string; headEmail?: string }> =
      new Map();

    const fileStream = Readable.from(file.buffer);

    if (file.originalname.match(/\.(csv)$/)) {
      await this.parseInitialCSV(fileStream, employees, departments, companyId);
    } else if (file.originalname.match(/\.(xlsx|xls)$/)) {
      await this.parseInitialExcel(
        fileStream,
        employees,
        departments,
        companyId,
      );
    } else {
      throw new BadRequestException('Unsupported file format.');
    }

    return { employees, departments: Array.from(departments.values()) };
  }

  private async parseInitialCSV(
    fileStream: Readable,
    employees: any[],
    departments: Map<string, { name: string; headEmail?: string }>,
    companyId: number,
  ) {
    return new Promise<void>((resolve, reject) => {
      fileStream
        .pipe(csvParser())
        .on('data', (row) => {
          const name = row['Name']?.trim();
          const email = row['Email']?.trim();
          const designation = row['Designation']?.trim();
          const managerEmail = row['ManagerEmail']?.trim();
          const departmentName = row['Department']?.trim();
          const departmentHeadEmail = row['DepartmentHeadEmail']?.trim();

          if (name && email && designation) {
            employees.push({
              name,
              email,
              designation,
              companyId,
              managerEmail,
              departmentName,
            });

            if (departmentName) {
              const existingDepartment = departments.get(departmentName);
              if (!existingDepartment) {
                departments.set(departmentName, {
                  name: departmentName,
                  headEmail: departmentHeadEmail || null,
                });
              } else if (departmentHeadEmail) {
                existingDepartment.headEmail = departmentHeadEmail;
              }
            }
          }
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });
  }

  private async parseInitialExcel(
    fileStream: Readable,
    employees: any[],
    departments: Map<string, { name: string; headEmail?: string }>,
    companyId: number,
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(fileStream);
    const worksheet = workbook.worksheets[0];

    worksheet.eachRow(async (row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header row

      const name = row.getCell(1)?.value?.toString().trim();
      const email = row.getCell(2)?.value?.toString().trim();
      const designation = row.getCell(3)?.value?.toString().trim();
      const managerEmail = row.getCell(4)?.value?.toString().trim();
      const departmentName = row.getCell(5)?.value?.toString().trim();
      const departmentHeadEmail = row.getCell(6)?.value?.toString().trim();
      const password = '12345678'; // Default password

      if (name && email && designation) {
        employees.push({
          name,
          email,
          designation,
          companyId,
          managerEmail,
          departmentName,
          password,
        });

        if (departmentName) {
          const existingDepartment = departments.get(departmentName);
          if (!existingDepartment) {
            departments.set(departmentName, {
              name: departmentName,
              headEmail: departmentHeadEmail || null,
            });
          } else if (departmentHeadEmail) {
            existingDepartment.headEmail = departmentHeadEmail;
          }
        }
      }
    });
  }
}
