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
    // Start by removing existing user_okrs if assigned_to is passed
    const updateData: any = {
      ...dto,
      audit: {
        updatedAt: new Date().toISOString(),
        updatedBy: userId, // Optional: update modifiedAt etc
      }, // Optional: update modifiedAt etc
    };

    if (dto.assignedTo) {
      updateData.assigned_to = {
        deleteMany: {}, // remove all current
        create: dto.assignedTo.map((user_id) => ({ user_id })),
      };
    }

    return this.prisma.okrs.update({
      where: { id },
      data: updateData,
    });
  }

  delete(id: number) {
    return this.prisma.okrs.delete({ where: { id } });
  }
}
