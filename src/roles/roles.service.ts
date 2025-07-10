// roles.service.ts
import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  AssignUsersDto,
} from './dto/roles.dto';

@Injectable()
export class RolesService {
  constructor(private rolesRepository: RolesRepository) {}

  // Create a role
  async createRole(createRoleDto: CreateRoleDto, createdBy: number) {
    return this.rolesRepository.createRole(createRoleDto, createdBy);
  }

  // Update a role
  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    return this.rolesRepository.updateRole(id, updateRoleDto);
  }

  // Assign permissions to a role by permission names
  async assignPermissionsToRole(
    roleId: number,
    assignPermissionsDto: AssignPermissionsDto,
  ) {
    const permissionNames = assignPermissionsDto.permissionNames;

    const permissions =
      await this.rolesRepository.getPermissionsByNames(permissionNames);

    return this.rolesRepository.assignPermissionsToRole(roleId, permissions);
  }

  // Assign users to a role
  async assignUsersToRole(roleId: number, assignUsersDto: AssignUsersDto) {
    return this.rolesRepository.assignUsersToRole(
      roleId,
      assignUsersDto.userIds,
    );
  }

  // Get all roles
  async getAllRoles() {
    const roles = await this.rolesRepository.getAllRoles();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      summary: role.summary,
      created_by: role.created_by,
      permissions: role.role_permissions.map((rp) => ({
        name: rp.permission.name,
        label: rp.permission.label,
      })),
    }));
  }

  // Get a role by ID
  async getRoleById(id: number) {
    const role = await this.rolesRepository.getRoleById(id);
    if (!role) {
      return null; // or throw an exception if preferred
    }
    return {
      id: role.id,
      name: role.name,
      summary: role.summary,
      created_by: role.created_by,
      permissions: role.role_permissions.map((rp) => ({
        name: rp.permission.name,
        label: rp.permission.label,
      })),
    };
  }

  // Delete a role
  async deleteRole(id: number) {
    return this.rolesRepository.deleteRole(id);
  }
}
