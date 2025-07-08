import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Make sure PrismaService is available
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './permissions.repository';

@Module({
  imports: [],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository, PrismaService], // Register all providers
})
export class PermissionsModule {}
