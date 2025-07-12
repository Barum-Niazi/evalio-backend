import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDepartment(name: string, companyId: number, headId?: number) {
    return this.prisma.$transaction(async (prisma) => {
      // Create the department
      const department = await prisma.department.create({
        data: {
          name,
          company_id: companyId,
          headId: headId || null,
        },
      });

      // If a headId is provided, update the user's department_id
      if (headId) {
        await prisma.user_details.update({
          where: { user_id: headId },
          data: { department_id: department.id },
        });
      }

      return prisma.department.findUnique({
        where: { id: department.id },
        include: { employees: true },
      });
    });
  }

  async createOrUpdateDepartment(
    name: string,
    companyId: number,
    headId: number | null,
    employeeIds: number[],
  ) {
    return this.prisma.department
      .upsert({
        where: {
          name_company_id: {
            name,
            company_id: companyId,
          },
        },
        update: {
          headId,
        },
        create: {
          name,
          company_id: companyId,
          headId,
        },
        include: {
          head: true,
          employees: true,
        },
      })
      .then(async (department) => {
        // Only update employees if `employeeIds` is not empty
        if (employeeIds.length > 0) {
          await this.prisma.user_details.updateMany({
            where: {
              user_id: { in: employeeIds },
            },
            data: {
              department_id: department.id,
            },
          });
        } else {
          console.warn(
            `No employees to assign to department: ${department.name}`,
          );
        }

        return department;
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

  async getEmployeesByDepartment(departmentId: number) {
    return this.prisma.user_details.findMany({
      where: { department_id: departmentId },
      include: {
        user: true, // Include user details if needed
      },
    });
  }

  async findByIdWithRelations(id: number) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          include: {
            user: true,
            designation: true,
          },
        },
        okrs: {
          include: {
            key_results: true,
          },
        },
        head: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async removeEmployeesFromDepartment(
    departmentId: number,
    employeeIds: number[],
    companyId: number,
  ): Promise<{ removed: number[]; notFound: number[] }> {
    const foundEmployees = await this.prisma.user_details.findMany({
      where: {
        user_id: { in: employeeIds },
        department_id: departmentId,
        company_id: companyId,
      },
      select: { user_id: true },
    });

    const foundIds = foundEmployees.map((e) => e.user_id);
    const notFound = employeeIds.filter((id) => !foundIds.includes(id));

    await this.prisma.user_details.updateMany({
      where: {
        user_id: { in: foundIds },
      },
      data: {
        department_id: null,
      },
    });

    return { removed: foundIds, notFound };
  }
}
