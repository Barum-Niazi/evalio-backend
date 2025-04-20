import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';
import { okrs } from '@prisma/client';

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

  findAll() {
    return this.prisma.okrs.findMany({
      include: {
        key_results: true,
        assigned_to: true,
        child_okrs: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.okrs.findUnique({
      where: { id },
      include: {
        key_results: true,
        assigned_to: true,
        parent_okr: true,
        child_okrs: true,
      },
    });
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

  getOkrsByParent(parentId: number | null) {
    return this.prisma.okrs.findMany({
      where: { parent_okr_id: parentId },
      include: {
        key_results: true,
      },
    });
  }

  async getByDepartment(departmentId: number) {
    return this.prisma.okrs.findMany({
      where: { department_id: departmentId },
      include: {
        key_results: true,
        assigned_to: {
          include: {
            user: true, // include user info if needed
          },
        },
      },
    });
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
}
