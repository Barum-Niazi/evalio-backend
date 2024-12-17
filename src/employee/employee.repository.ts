import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  createEmployee(employee: any): Prisma.PrismaPromise<any> {
    const { name, email, password, designation, companyId, managerId } =
      employee;

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
                where: { name: 'Employee' }, // Assuming 'Employee' is a general role for all users
                create: { name: 'Employee' },
              },
            },
          },
        },
        details: {
          create: {
            name,
            company: { connect: { id: companyId } },
            manager: managerId
              ? { connect: { user_id: managerId } }
              : undefined,
            designation: {
              connectOrCreate: {
                where: { title: designation },
                create: { title: designation },
              },
            },
          },
        },
      },
    });
  }

  async getManagerIdByEmail(email: string): Promise<number | null> {
    const manager = await this.prisma.user_auth.findUnique({
      where: { email },
      select: { user_id: true },
    });
    return manager?.user_id || null;
  }

  async createManyEmployees(employees: any[]) {
    return this.prisma.$transaction(async (prisma) => {
      const userIds = new Map(); // Store user IDs mapped by email
      const createdEmployees: { user_id: number; email: string }[] = []; // Accumulate created employee data

      // Step 1: Create `users` and `user_auth` entries for all employees
      for (const employee of employees) {
        if (userIds.has(employee.email)) continue; // Skip duplicates in the input file

        const user = await prisma.users.create({
          data: {
            auth: {
              create: {
                email: employee.email,
                password: employee.password,
              },
            },
            details: {
              create: {
                name: employee.name,
                company: {
                  connect: { id: employee.companyId },
                },
                designation: {
                  connectOrCreate: {
                    where: { title: employee.designation },
                    create: { title: employee.designation },
                  },
                },
                // Leave manager unresolved for now
              },
            },
          },
          include: {
            auth: true, // Include email for mapping
          },
        });

        userIds.set(employee.email, user.id); // Map email to user ID
        createdEmployees.push({
          user_id: user.id,
          email: user.auth?.email, // Include email for mapping
        });
      }

      // Step 2: Update employees with their correct manager references
      for (const employee of employees) {
        if (!employee.managerEmail) continue; // Skip if no manager specified

        const managerId = userIds.get(employee.managerEmail);
        if (managerId) {
          await prisma.user_details.update({
            where: { user_id: userIds.get(employee.email) }, // Find the employee
            data: {
              manager: { connect: { user_id: managerId } }, // Connect manager
            },
          });
        }
      }

      // Step 3: Fetch or create the "Employee" role
      let employeeRole = await prisma.roles.findUnique({
        where: { name: 'Employee' },
      });

      if (!employeeRole) {
        employeeRole = await prisma.roles.create({
          data: { name: 'Employee' },
        });
      }

      // Step 4: Prepare `user_roles` data with resolved `role_id`
      const rolesData = Array.from(userIds.values()).map((userId) => ({
        user_id: userId,
        role_id: employeeRole.id,
      }));

      // Step 5: Insert `user_roles` in bulk
      await prisma.user_roles.createMany({
        data: rolesData,
        skipDuplicates: true, // Avoid duplicate entries
      });

      return {
        message: 'Employees added successfully',
        length: userIds.size,
        createdEmployees, // Include created employees in the return
      };
    });
  }

  async getEmailToEmployeeId(companyId: number): Promise<Map<string, number>> {
    const employees = await this.prisma.user_details.findMany({
      where: { company_id: companyId },
      select: {
        user_id: true,
        user: {
          select: {
            auth: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // Build and return the map
    return employees.reduce((map, employee) => {
      const email = employee.user?.auth?.email;
      if (email) {
        map[email] = employee.user_id;
      }
      return map;
    }, new Map<string, number>());
  }

  async getEmployeesByCompany(companyId: number): Promise<
    {
      user_id: number;
      name: string;
      manager: { user_id: number; name: string } | null;
      designation: { title: string } | null;
      department: { name: string } | null;
    }[]
  > {
    return this.prisma.user_details.findMany({
      where: {
        company_id: companyId,
        user: {
          roles: {
            none: {
              role: {
                name: 'Admin', // Exclude users with the Admin role
              },
            },
          },
        },
      },
      select: {
        user_id: true,
        name: true,
        manager: {
          select: {
            user_id: true,
            name: true,
          },
        },
        designation: {
          select: {
            title: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async getAdminCompanyId(adminId: number): Promise<number | null> {
    const admin = await this.prisma.user_details.findUnique({
      where: { user_id: adminId },
      select: { company_id: true },
    });
    if (!admin || !admin.company_id) {
      throw new ForbiddenException('Admin is not associated with any company.');
    }
    return admin.company_id;
  }
}
