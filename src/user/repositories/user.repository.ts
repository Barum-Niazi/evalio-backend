import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { user_auth, users, roles } from '@prisma/client'; // Import types from your Prisma schema

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
      include: {
        user: {
          include: {
            roles: {
              select: {
                role: {
                  select: { name: true }, // Fetch the role name
                },
              },
            },
          },
        },
      },
    });

    // Debugging: Log the full result
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
    companyName: string,
  ): Promise<users> {
    return this.prisma.users.create({
      data: {
        // Link user to authentication credentials
        auth: {
          create: {
            email,
            password,
          },
        },
        // Create or link the Admin role
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
        // Create user details and the associated company
        details: {
          create: {
            name, // Admin's name
            company: {
              create: {
                name: companyName, // Create the company with the provided name
              },
            },
          },
        },
      },
    });
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
}
