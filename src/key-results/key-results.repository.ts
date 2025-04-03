import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateKeyResultDto, UpdateKeyResultDto } from './dto/key-results.dto';

@Injectable()
export class KeyResultsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKeyResultDto) {
    return this.prisma.key_results.create({
      data: {
        title: dto.title,
        okr_id: dto.okrId,
        parent_key_result_id: dto.parentKeyResultId,
        audit: {},
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

  async update(dto: UpdateKeyResultDto) {
    return this.prisma.key_results.update({
      where: { id: dto.id },
      data: {
        title: dto.title,
        progress: dto.progress,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.key_results.delete({ where: { id } });
  }
}
