import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { companies, company_settings } from '@prisma/client';

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

      await prisma.company_settings.create({
        data: {
          company_id: company.id,
          allow_anonymous_feedback: true, // default or customizable later
          enable_okrs: true,
          enable_1on1s: true,
          enable_note_to_self: true,
          enable_feedback_requests: true,
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

  async findById(id: number) {
    return this.prisma.companies.findUnique({
      where: { id },
      include: {
        logo_blob: {
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
        manager: {
          select: {
            user_id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
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
    });
  }

  async updateCompany(id: number, data: Partial<companies>) {
    return this.prisma.companies.update({
      where: { id },
      data,
    });
  }

  async getSettings(companyId: number) {
    return this.prisma.company_settings.findUnique({
      where: { company_id: companyId },
    });
  }

  async updateSettings(companyId: number, data: Partial<company_settings>) {
    return this.prisma.company_settings.update({
      where: { company_id: companyId },
      data,
    });
  }
}
