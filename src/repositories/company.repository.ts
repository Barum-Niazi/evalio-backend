import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCompanyWithLogo(
    adminId: number,
    companyData: { name: string; description: string; address?: string },
    logo?: Express.Multer.File,
  ) {
    return await this.prisma.$transaction(async (prisma) => {
      let logoBlobId: number | null = null;

      // Handle file upload
      if (logo) {
        const logoBlob = await prisma.blob.create({
          data: {
            name: logo.originalname,
            mime_type: logo.mimetype,
            data: logo.buffer,
            size: logo.size,
          },
        });
        logoBlobId = logoBlob.id;
      }

      // Create the company
      const company = await prisma.companies.create({
        data: {
          name: companyData.name,
          description: companyData.description,
          address: companyData.address,
          logo_blob_id: logoBlobId,
          employees: {
            connect: {
              user_id: adminId,
            },
          },
        },
      });

      return company;
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

  async getUsersByCompany(companyId: number): Promise<
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

  async getCompanyStats(companyId: number) {
    const [departmentCount, employeeCount] = await this.prisma.$transaction([
      this.prisma.department.count({
        where: { company_id: companyId },
      }),
      this.prisma.user_details.count({
        where: { company_id: companyId },
      }),
    ]);

    return {
      departments: departmentCount,
      employees: employeeCount,
    };
  }

  async getOrganizationalData(companyId: number) {
    return this.prisma.user_details.findMany({
      where: { company_id: companyId },
      include: {
        manager: { select: { user_id: true, name: true } }, // Manager information
        department: { select: { id: true, name: true } }, // Department information
        designation: { select: { id: true, title: true } }, // Designation details
      },
    });
  }
}
