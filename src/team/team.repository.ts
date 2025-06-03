import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TeamRepository {
  constructor(private prisma: PrismaService) {}

  async findTeamMembers(managerUserId: number) {
    return this.prisma.user_details.findMany({
      where: {
        manager_id: managerUserId,
      },
      select: {
        user_id: true,
        name: true,
        profile_blob_id: true,
        manager_id: true,
        department: {
          select: {
            name: true,
          },
        },
        designation: {
          select: {
            title: true,
          },
        },
      },
    });
  }
}
