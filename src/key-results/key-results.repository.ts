import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateKeyResultDto, UpdateKeyResultDto } from './dto/key-results.dto';

@Injectable()
export class KeyResultsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKeyResultDto, userId: number) {
    return this.prisma.key_results.create({
      data: {
        title: dto.title,
        okr_id: dto.okrId,
        parent_key_result_id: dto.parentKeyResultId,
        progress: dto.progress ?? 0,
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: userId,
        },
      },
    });
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
    const updateData: any = {
      audit: {
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      },
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    if (dto.parentKeyResultId !== undefined) {
      updateData.parent_key_result_id = dto.parentKeyResultId;
    }

    return this.prisma.key_results.update({
      where: { id },
      data: updateData,
    });
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
