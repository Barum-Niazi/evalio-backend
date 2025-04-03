import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';

@Injectable()
export class OkrRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOkr(dto: CreateOkrDto) {
    return this.prisma.okrs.create({
      data: {
        title: dto.title,
        description: dto.description,
        user_id: dto.userId,
        company_id: dto.companyId,
        parent_okr_id: dto.parentOkrId,
        audit: {},
      },
    });
  }

  async getOkrById(okrId: number) {
    return this.prisma.okrs.findUnique({
      where: { id: okrId },
    });
  }

  async getAllOkrs() {
    return this.prisma.okrs.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async updateOkr(dto: UpdateOkrDto) {
    return this.prisma.okrs.update({
      where: { id: dto.okrId },
      data: {
        title: dto.title,
        description: dto.description,
      },
    });
  }

  async deleteOkr(okrId: number) {
    return this.prisma.okrs.delete({
      where: { id: okrId },
    });
  }
}
