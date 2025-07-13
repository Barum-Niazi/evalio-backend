import { ForbiddenException, Injectable } from '@nestjs/common';
import { DepartmentRepository } from './department.repository';
import { UserRepository } from 'src/user/user.repository';
import { AddEmployeesToDepartmentsDto } from './dto/add-employees.dto';
import { calculateOkrProgress } from 'src/okr/okr,utils';
import { transformDepartmentResponse } from './department.utils';
import { RemoveEmployeesFromDepartmentsDto } from './dto/remove-employees.dto';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createDepartment(name: string, companyId: number, headId?: number) {
    return this.departmentRepository.createDepartment(name, companyId, headId);
  }

  async getDepartmentsByCompany(companyId: number) {
    return this.departmentRepository.getDepartmentsByCompany(companyId);
  }

  async updateDepartment(id: number, data: { name?: string; headId?: number }) {
    return this.departmentRepository.updateDepartment(id, data);
  }

  async deleteDepartment(id: number) {
    return this.departmentRepository.deleteDepartment(id);
  }

  async getUserIdsByEmails(emails: string[]) {
    return this.userRepository.getUserIdsByEmails(emails);
  }

  async addEmployeesToDepartments(
    dto: AddEmployeesToDepartmentsDto,
    companyId: number,
  ) {
    const departments = await this.getDepartmentsByCompany(companyId);
    const results = [];

    for (const { departmentId, employeeIds } of dto.departments) {
      const department = departments.find((d) => d.id === departmentId);
      if (!department) {
        throw new ForbiddenException(
          `You do not have access to department ID ${departmentId}.`,
        );
      }
      const result = await this.departmentRepository.addEmployeesToDepartment(
        departmentId,
        employeeIds,
      );

      results.push({ departmentId, addedEmployees: result });
    }

    return results;
  }

  async getByIdWithDetails(id: number) {
    const department =
      await this.departmentRepository.findByIdWithRelations(id);
    if (!department) return null;

    const stats = {
      completed: 0,
      inProgress: 0,
      notStarted: 0,
    };

    for (const okr of department.okrs) {
      const progress = calculateOkrProgress(okr.key_results);
      if (progress === 0) stats.notStarted++;
      else if (progress < 100) stats.inProgress++;
      else stats.completed++;
    }

    const headBlobId = department.head?.profile_blob?.id;
    const transformedEmployees = department.employees.map((emp) => {
      const blobId = emp.profile_blob?.id;

      console.log('Blob ID:', blobId);
      console.log('Profile Image URL:', blobId ? `/blob/${blobId}/view` : null);

      return {
        ...emp,
        profileImage: blobId ? `/blob/${blobId}/view` : null,
      };
    });

    return transformDepartmentResponse({
      ...department,
      head: {
        ...department.head,
        profileImage: headBlobId ? `/blob/${headBlobId}/view` : null,
      },
      employees: transformedEmployees,
      progressBreakdown: stats,
    });
  }

  async removeEmployeesFromDepartments(
    dto: RemoveEmployeesFromDepartmentsDto,
    companyId: number,
  ): Promise<{ removed: number[]; notFound: number[] }> {
    return this.departmentRepository.removeEmployeesFromDepartment(
      dto.departmentId,
      dto.employeeIds,
      companyId,
    );
  }
}
