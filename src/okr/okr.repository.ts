import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';
import { okrs } from '@prisma/client';
import { calculateOkrProgress } from './okr,utils';

@Injectable()
export class OkrRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOkrDto): Promise<okrs> {
    let departmentUserIds: number[] = [];

    if (dto.departmentId) {
      const employees = await this.prisma.user_details.findMany({
        where: { department_id: dto.departmentId },
        select: { user_id: true },
      });
      departmentUserIds = employees.map((e) => e.user_id);
    }

    // Merge both: unique user IDs only
    const allAssignees = Array.from(
      new Set([...(dto.assignedTo ?? []), ...departmentUserIds]),
    );

    return this.prisma.okrs.create({
      data: {
        title: dto.title,
        description: dto.description,
        company_id: dto.companyId,
        user_id: dto.userId,
        parent_okr_id: dto.parentOkrId,
        department_id: dto.departmentId,
        due_date: dto.dueDate,
        start_date: new Date().toISOString(),
        assigned_to: {
          create: allAssignees.map((user_id) => ({ user_id })),
        },
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: dto.userId,
        },
      },
    });
  }

  async getAllByCompany(companyId: number) {
    const okrs = await this.prisma.okrs.findMany({
      where: {
        company_id: companyId,
      },
      include: {
        key_results: true,
        assigned_to: true,
        child_okrs: true,
      },
    });

    return okrs.map((okr) => ({
      ...okr,
      progress: calculateOkrProgress(okr.key_results),
    }));
  }

  async findOne(id: number) {
    const okr = await this.prisma.okrs.findUnique({
      where: { id },
      include: {
        key_results: true,
        assigned_to: true,
        parent_okr: true,
        child_okrs: true,
      },
    });

    if (!okr) return null;

    return {
      ...okr,
      progress: calculateOkrProgress(okr.key_results),
    };
  }

  async update(id: number, dto: UpdateOkrDto, userId: number) {
    const updateData: any = {
      audit: {
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      },
    };

    // Set updated fields
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.parentOkrId !== undefined)
      updateData.parent_okr_id = dto.parentOkrId;
    if (dto.departmentId !== undefined)
      updateData.department_id = dto.departmentId;

    // Combine department employees + manual assignments
    let allAssignees: number[] = [];

    if (dto.departmentId !== undefined) {
      const employees = await this.prisma.user_details.findMany({
        where: { department_id: dto.departmentId },
        select: { user_id: true },
      });
      allAssignees.push(...employees.map((e) => e.user_id));
    }

    if (dto.assignedTo) {
      allAssignees.push(...dto.assignedTo);
    }

    if (allAssignees.length > 0) {
      const uniqueUserIds = Array.from(new Set(allAssignees));
      updateData.assigned_to = {
        deleteMany: {}, // reset previous assignments
        create: uniqueUserIds.map((user_id) => ({ user_id })),
      };
    }

    return this.prisma.okrs.update({
      where: { id },
      data: updateData,
      include: {
        assigned_to: {
          select: { user_id: true },
        },
      },
    });
  }

  async getOkrsByParent(parentId: number | null) {
    const okrs = await this.prisma.okrs.findMany({
      where: { parent_okr_id: parentId },
      include: {
        key_results: true,
        // Owner: get user_details by user_id
        department: {
          select: {
            name: true,
          },
        },
        assigned_to: {
          include: {
            user: {
              select: {
                user_id: true,
                name: true,
                designation: {
                  select: {
                    title: true,
                  },
                },
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Now we need to fetch owner separately via user_id → user_details
    const enrichedOkrs = await Promise.all(
      okrs.map(async (okr) => {
        const owner =
          okr.user_id != null
            ? await this.prisma.user_details.findUnique({
                where: { user_id: okr.user_id },
                select: {
                  user_id: true,
                  name: true,
                  designation: {
                    select: { title: true },
                  },
                  department: {
                    select: { name: true },
                  },
                },
              })
            : null;

        return {
          ...okr,
          progress: calculateOkrProgress(okr.key_results),
        };
      }),
    );

    return enrichedOkrs;
  }

  async getByDepartment(departmentId: number) {
    const okrs = await this.prisma.okrs.findMany({
      where: { department_id: departmentId },
      include: {
        key_results: true,
        assigned_to: {
          include: {
            user: true,
          },
        },
      },
    });

    return okrs.map((okr) => ({
      ...okr,
      progress: calculateOkrProgress(okr.key_results),
    }));
  }

  async findById(id: number) {
    return this.prisma.okrs.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true, // for permission check
      },
    });
  }

  delete(id: number) {
    return this.prisma.okrs.delete({ where: { id } });
  }

  async getByUser(userId: number) {
    const okrs = await this.prisma.okrs.findMany({
      where: {
        assigned_to: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        department: true,
        key_results: true,
        assigned_to: {
          include: {
            user: true,
          },
        },
      },
    });

    return okrs.map((okr) => ({
      ...okr,
      progress: calculateOkrProgress(okr.key_results),
    }));
  }

  async getOkrsWithProgressByCompany(companyId: number) {
    return this.prisma.okrs.findMany({
      where: {
        company_id: companyId,
        // department_id: { not: null }, // optional: skip unassigned
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        key_results: true,
      },
    });
  }

  async getAllOkrsWithKeyResults(companyId: number) {
    return this.prisma.okrs.findMany({
      where: { company_id: companyId },
      include: {
        key_results: true,
      },
    });
  }

  async getOkrsWithDueDatesAndDepartments(companyId: number) {
    return this.prisma.okrs.findMany({
      where: {
        company_id: companyId,
        due_date: { not: null },
      },
      include: {
        key_results: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
