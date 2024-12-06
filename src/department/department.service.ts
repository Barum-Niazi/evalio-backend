import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from '../repositories/department.repository';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

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

  async addEmployeesToDepartment(departmentId: number, employeeIds: number[]) {
    return this.departmentRepository.addEmployeesToDepartment(
      departmentId,
      employeeIds,
    );
  }
}
