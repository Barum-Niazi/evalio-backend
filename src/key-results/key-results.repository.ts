import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateKeyResultDto, UpdateKeyResultDto } from './dto/key-results.dto';

@Injectable()
export class KeyResultsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateParentProgress(parentId: number) {
    const children = await this.prisma.key_results.findMany({
      where: { parent_key_result_id: parentId },
      select: { progress: true },
    });

    if (!children.length) return;

    const total = children.reduce((acc, c) => acc + (c.progress ?? 0), 0);
    const average = Math.round(total / children.length);

    await this.prisma.key_results.update({
      where: { id: parentId },
      data: {
        progress: average,
      },
    });
  }

  async create(dto: CreateKeyResultDto, userId: number) {
    const kr = await this.prisma.key_results.create({
      data: {
        title: dto.title,
        okr_id: dto.okrId,
        parent_key_result_id: dto.parentKeyResultId,
        progress: dto.progress ?? 0,
        weight: dto.weight ?? 0,
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      },
    });

    if (dto.parentKeyResultId) {
      await this.updateParentProgress(dto.parentKeyResultId);
    }

    return kr;
  }

  async findById(id: number) {
    return this.prisma.key_results.findUnique({ where: { id } });
  }

  async findAllByOkr(okrId: number) {
    return this.prisma.key_results.findMany({
      where: { okr_id: okrId },
      orderBy: { id: 'desc' },
    });
  }

  async update(id: number, dto: UpdateKeyResultDto, userId: number) {
    // Step 1: Fetch current KR to compare its original parent
    const krBefore = await this.prisma.key_results.findUnique({
      where: { id },
      select: { parent_key_result_id: true },
    });

    // Step 2: Build update payload
    const updateData: any = {
      audit: {
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      },
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    // if (dto.parentKeyResultId !== undefined) {
    //   updateData.parent_key_result_id = dto.parentKeyResultId;
    // }

    // Step 3: Perform the update
    const updated = await this.prisma.key_results.update({
      where: { id },
      data: updateData,
    });

    // Step 4: Determine which parent(s) need to be re-evaluated
    const parentsToUpdate = new Set<number>();

    // If progress changed, update the old parent
    if (dto.progress !== undefined && krBefore?.parent_key_result_id) {
      parentsToUpdate.add(krBefore.parent_key_result_id);
    }

    // If parent was reassigned, update the new parent too
    // if (
    //   dto.parentKeyResultId &&
    //   dto.parentKeyResultId !== krBefore?.parent_key_result_id
    // ) {
    //   parentsToUpdate.add(dto.parentKeyResultId);
    // }

    // Step 5: Update parent progress in DB
    for (const parentId of parentsToUpdate) {
      await this.updateParentProgress(parentId);
    }

    return updated;
  }

  async findOKR(okrId: number, userId: number) {
    {
      return this.prisma.okrs.findUnique({
        where: { id: okrId },
        include: {
          assigned_to: true,
        },
      });
    }
  }

  async findByIdWithOkr(id: number) {
    return this.prisma.key_results.findUnique({
      where: { id },
      select: {
        id: true,
        okr: {
          select: {
            id: true,
            assigned_to: {
              select: { user_id: true },
            },
          },
        },
      },
    });
  }

  async delete(id: number) {
    return this.prisma.key_results.delete({ where: { id } });
  }
}
