import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateCompanySettingsDto,
} from './dto/company.dto';
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

    // Create the company
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

    // Parse the file for employees and departments
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
    // Create employees in the database
    const createdEmployees =
      await this.employeeRepository.createManyEmployees(employees);

    // Fetch email-to-user_id mapping
    const emailToUserId: Record<string, number> = {};
    createdEmployees.createdEmployees.forEach((employee) => {
      const email = employee.email?.trim().toLowerCase(); // Normalize email
      if (email) {
        emailToUserId[email] = employee.user_id; // Store in the object
      }
    });

    console.log('Email to User ID mapping:', emailToUserId);

    // Create or update departments with resolved head and employee IDs
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
  async updateCompany(id: number, dto: UpdateCompanyDto) {
    const company = await this.companyRepository.findById(id);
    if (!company) throw new NotFoundException('Company not found');

    const updatedMetadata = {
      ...((company.metadata ?? {}) as Record<string, any>),
      ...((dto.metadata ?? {}) as Record<string, any>),
    };

    return this.companyRepository.updateCompany(id, {
      name: dto.name,
      address: dto.address,
      description: dto.description,
      metadata: updatedMetadata,
    });
  }
  async getCompany(companyId: number) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    // Construct URL for the logo blob if it exists
    const logoBlob = company.logo_blob
      ? {
          ...company.logo_blob,
          url: `/blob/${company.logo_blob.id}/view`,
        }
      : null;

    return {
      ...company,
      logo_blob: logoBlob,
    };
  }
  async getCompanySettings(companyId: number) {
    const settings = await this.companyRepository.getSettings(companyId);
    if (!settings) throw new NotFoundException('Settings not found');
    return settings;
  }

  async updateSettings(companyId: number, dto: UpdateCompanySettingsDto) {
    const settings = await this.companyRepository.getSettings(companyId);
    if (!settings) throw new NotFoundException('Settings not found');

    return this.companyRepository.updateSettings(companyId, dto);
  }

  async getCompanyStats(adminId: number) {
    const companyId = await this.companyRepository.getAdminCompanyId(adminId);
    const data = await this.companyRepository.getCompanyStats(companyId);

    return data;
  }

  async getOrganizationalChart(companyId: number) {
    const employees =
      await this.companyRepository.getOrganizationalData(companyId);

    const groupedByManager = employees.reduce(
      (acc, employee) => {
        const managerId = employee.manager_id || null;
        if (!acc[managerId]) {
          acc[managerId] = [];
        }
        acc[managerId].push(employee);
        return acc;
      },
      {} as Record<number | null, typeof employees>,
    );

    const buildHierarchy = (managerId: number | null) => {
      return (groupedByManager[managerId] || []).map((employee) => ({
        id: employee.user_id,
        name: employee.name,
        designation: employee.designation?.title || 'N/A',
        department: employee.department?.name || 'Unassigned',
        profileImage: employee.profile_blob
          ? {
              id: employee.profile_blob.id,
              name: employee.profile_blob.name,
              mimeType: employee.profile_blob.mime_type,
              size: employee.profile_blob.size,
              url: `/blob/${employee.profile_blob.id}/view`,
            }
          : null,
        subordinates: buildHierarchy(employee.user_id),
      }));
    };

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

    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);

      const name = row.getCell(1)?.value?.toString().trim();
      const email = row.getCell(2)?.value?.toString().trim();
      const designation = row.getCell(3)?.value?.toString().trim();
      const managerEmail = row.getCell(4)?.value?.toString().trim();
      const departmentName = row.getCell(5)?.value?.toString().trim();
      const departmentHeadEmail = row.getCell(6)?.value?.toString().trim();
      const rolesRaw = row.getCell(7)?.value?.toString().trim(); // Add this if you want roles
      const roles = rolesRaw
        ? rolesRaw.split(',').map((r) => r.trim())
        : ['Employee'];

      if (name && email && designation) {
        const password = '12345678'; // Default password
        const hashedPassword = await argon2.hash(password);

        employees.push({
          name,
          email,
          designation,
          companyId,
          managerEmail,
          departmentName,
          hashedPassword,
          roles,
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
    }
  }
}
