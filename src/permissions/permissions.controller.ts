import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorators';
import { Permissions } from 'src/decorators/permissions.decorators';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // Get all available permissions
  @UseGuards(JwtAuthGuard)
  @Roles('admin') // Ensure only admin users can access this endpoint
  @Permissions('manage_roles')
  @Get()
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }
}
