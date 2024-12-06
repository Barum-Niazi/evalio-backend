import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDepartment(name: string, companyId: number, headId?: number) {
    return this.prisma.department.create({
      data: {
        name,
        company_id: companyId,
        headId: headId || null,
      },
      select: {
        id: true,
        name: true,
        company_id: true,
        headId: true,
      },
    });
  }

  async getDepartmentsByCompany(companyId: number) {
    const departments = await this.prisma.department.findMany({
      where: { company_id: companyId },
      include: {
        head: true,
        employees: true,
      },
    });

    return departments.map((department) => ({
      id: department.id,
      name: department.name,
      companyId: department.company_id,
      headId: department.headId,
      head: department.head,
      employees: department.employees,
      audit: department.audit, // Assuming no transformation needed for JSON fields
    }));
  }

  async updateDepartment(id: number, data: { name?: string; headId?: number }) {
    const transformedData: any = {};
    if (data.name !== undefined) transformedData.name = data.name;
    if (data.headId !== undefined) transformedData.headId = data.headId;

    return this.prisma.department.update({
      where: { id },
      data: transformedData,
      select: {
        id: true,
        name: true,
        company_id: true,
        headId: true,
      },
    });
  }

  async deleteDepartment(id: number) {
    return this.prisma.department.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        company_id: true,
      },
    });
  }

  async addEmployeesToDepartment(departmentId: number, employeeIds: number[]) {
    return this.prisma.$transaction(async (prisma) => {
      const updates = employeeIds.map((employeeId) =>
        prisma.user_details.update({
          where: { user_id: employeeId },
          data: {
            department_id: departmentId, // Link employee to the department
          },
        }),
      );

      await Promise.all(updates);

      return prisma.department.findUnique({
        where: { id: departmentId },
        include: { employees: true },
      });
    });
  }
}
