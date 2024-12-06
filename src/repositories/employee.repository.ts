import { Injectable } from '@nestjs/common';
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
                where: { name: designation },
                create: { name: designation },
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
        });

        userIds.set(employee.email, user.id); // Map email to user ID
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
      };
    });
  }
}
