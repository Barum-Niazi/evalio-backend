import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, users } from '@prisma/client'; // Import types from your Prisma schema

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildRoleConnections(roleNames: string[]) {
    return roleNames.map((roleName) => ({
      role: {
        connectOrCreate: {
          where: { name: roleName },
          create: { name: roleName },
        },
      },
    }));
  }

  async findByEmail(email: string): Promise<any> {
    const userAuth = await this.prisma.user_auth.findUnique({
      where: { email },
      select: {
        email: true,
        password: true, // Include the email field
        user: {
          select: {
            id: true, // Include user ID
            roles: {
              select: {
                role: {
                  select: { name: true }, // Fetch the role name
                },
              },
            },
            details: {
              select: {
                name: true, // Fetch the user's name
                company_id: true, // Fetch the company ID
              },
            },
          },
        },
      },
    });

    console.log(JSON.stringify(userAuth, null, 2));

    return userAuth;
  }

  async createAdmin(
    name: string,
    email: string,
    password: string,
  ): Promise<any> {
    const newUser = await this.prisma.users.create({
      data: {
        auth: {
          create: {
            email,
            password,
          },
        },
        roles: {
          create: this.buildRoleConnections(['Admin']),
        },
        details: {
          create: {
            name,
          },
        },
      },
      include: {
        auth: { select: { email: true } },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return newUser;
  }

  async findCompanyUsers(companyId: number): Promise<any[]> {
    return this.prisma.users.findMany({
      where: { details: { company: { id: companyId } } },
      include: {
        details: {
          select: { name: true }, // Include the user's name
        },
        roles: {
          select: {
            role: {
              select: { name: true }, // Include the role's name
            },
          },
        },
      },
    });
  }

  async getUserIdsByEmails(emails: string[]): Promise<number[]> {
    const users = await this.prisma.user_auth.findMany({
      where: { email: { in: emails } },
      select: { user_id: true },
    });

    return users.map((user) => user.user_id);
  }

  async updateGoogleTokens(
    userId: number,
    tokens: { access_token: string; refresh_token: string },
    email: string,
  ) {
    return this.prisma.user_auth.update({
      where: { user_id: userId },
      data: {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_email: email,
      },
    });
  }

  async getUserProfileById(userId: number) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        auth: {
          select: { email: true },
        },
        roles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
        details: {
          select: {
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
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
            manager: {
              select: {
                user_id: true,
                name: true,
                profile_blob: {
                  select: {
                    id: true,
                    name: true,
                    mime_type: true,
                    size: true,
                  },
                },
              },
            },
            subordinates: {
              select: {
                user_id: true,
                name: true,
                profile_blob: {
                  select: {
                    id: true,
                    name: true,
                    mime_type: true,
                    size: true,
                  },
                },
              },
            },
            profile_blob: {
              select: {
                id: true,
                name: true,
                mime_type: true,
                size: true,
              },
            },
          },
        },
      },
    });
  }

  async updatePassword(userId: number, hashedPassword: string) {
    return this.prisma.user_auth.update({
      where: { user_id: userId },
      data: { password: hashedPassword },
    });
  }
  async updateUserDetails(
    userId: number,
    data: {
      name?: string;
      profile_blob_id?: number;
      metadata?: any;
    },
  ) {
    return this.prisma.user_details.update({
      where: { user_id: userId },
      data,
    });
  }

  async findPeersByManager(managerId: number, excludeUserId: number) {
    return this.prisma.user_details.findMany({
      where: {
        manager_id: managerId,
        NOT: { user_id: excludeUserId },
      },
      select: {
        user_id: true,
        name: true,
        profile_blob: {
          select: {
            id: true,
            name: true,
            mime_type: true,
            size: true,
          },
        },
      },
    });
  }

  async getProfileBlobsForUserIds(userIds: number[]) {
    return this.prisma.user_details.findMany({
      where: { user_id: { in: userIds } },
      select: {
        user_id: true,
        profile_blob: {
          select: {
            id: true,
            name: true,
            mime_type: true,
            size: true,
          },
        },
      },
    });
  }

  async deleteUser(userId: number) {
    return this.prisma.users.delete({ where: { id: userId } });
  }
}
