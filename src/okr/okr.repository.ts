import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';

@Injectable()
export class OkrRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOkrDto) {
    return this.prisma.okrs.create({
      data: {
        title: dto.title,
        description: dto.description,
        company_id: dto.companyId,
        user_id: dto.userId,
        parent_okr_id: dto.parentOkrId,
        assigned_to: {
          create: dto.assignedTo?.map((user_id) => ({ user_id })) ?? [],
        },
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: dto.userId, // assuming user_id is available
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

    // Explicitly map only known fields
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.parentOkrId !== undefined)
      updateData.parent_okr_id = dto.parentOkrId;

    if (dto.assignedTo) {
      updateData.assigned_to = {
        deleteMany: {}, // remove all current assignments
        create: dto.assignedTo.map((user_id) => ({ user_id })),
      };
    }

    return this.prisma.okrs.update({
      where: { id },
      data: updateData,
      include: {
        // only the user id from assigned to
        assigned_to: {
          select: { user_id: true },
        },
      },
    });
  }

  delete(id: number) {
    return this.prisma.okrs.delete({ where: { id } });
  }

  getOkrsByParent(parentId: number | null) {
    return this.prisma.okrs.findMany({
      where: { parent_okr_id: parentId },
      include: {
        key_results: true,
      },
    });
  }
}
