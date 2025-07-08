import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Get all permissions from the database
  async getAllPermissions() {
    return this.prisma.permissions.findMany(); // Fetch all permissions
  }
}
