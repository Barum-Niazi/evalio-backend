import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { users } from '@prisma/client'; // Import types from your Prisma schema

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by their email in the `user_auth` table
   * @param email - The email of the user to find
   * @returns The user_auth record or null
   */
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

  /**
   * @param name - The name of the admin user
   * @param email - The email for the admin's authentication
   * @param password - The hashed password for the admin
   * @param companyName - The name of the company to create
   * @returns The created admin user with all relationships
   */
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
          create: {
            role: {
              connectOrCreate: {
                where: { name: 'Admin' },
                create: { name: 'Admin' },
              },
            },
          },
        },
        details: {
          create: {
            name,
          },
        },
      },
      include: {
        auth: { select: { email: true } },
      },
    });

    return newUser;
  }
  async createEmployee(
    name: string,
    email: string,
    password: string,
    companyId: number,
  ): Promise<users> {
    return this.prisma.users.create({
      data: {
        auth: {
          create: {
            email,
            password,
          },
        },
        roles: {
          create: {
            role: {
              connectOrCreate: {
                where: { name: 'Employee' },
                create: { name: 'Employee' },
              },
            },
          },
        },
        details: {
          create: {
            name,
            company: {
              connect: { id: companyId },
            },
          },
        },
      },
    });
  }

  // gimme function to find company users with their names and with their roles title as well

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
  ) {
    return this.prisma.user_auth.update({
      where: { user_id: userId },
      data: {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      },
    });
  }
}
