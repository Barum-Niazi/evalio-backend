// roles.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  UsePipes,
  ParseIntPipe,
  Request,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  AssignUsersDto,
} from './dto/roles.dto';
import { Permissions } from '../decorators/permissions.decorators';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // Create a new role
  @Post()
  @UseGuards(JwtAuthGuard)
  @Permissions('create_role')
  async createRole(@Request() req, @Body() createRoleDto: CreateRoleDto) {
    const createdBy = req.user.id;
    console.log(req.user);
    return this.rolesService.createRole(createRoleDto, createdBy);
  }

  // Update an existing role
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('create_role') // because if user can create a role, they can also update it
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  // Assign permissions to a role
  @Post(':id/permissions')
  @UseGuards(JwtAuthGuard)
  @Permissions('create_role')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissionsToRole(id, assignPermissionsDto);
  }

  // Assign users to a role
  @Post(':id/users')
  @UseGuards(JwtAuthGuard)
  @Permissions('create_role')
  async assignUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.rolesService.assignUsersToRole(id, assignUsersDto);
  }

  // Get all roles
  @Get()
  @UseGuards(JwtAuthGuard)
  @Permissions('manage_roles')
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  // Get a specific role by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('manage_roles')
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('manage_roles')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }
}
