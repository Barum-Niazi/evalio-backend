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
    return this.rolesRepository.getAllRoles();
  }

  // Get a role by ID
  async getRoleById(id: number) {
    return this.rolesRepository.getRoleById(id);
  }

  // Delete a role
  async deleteRole(id: number) {
    return this.rolesRepository.deleteRole(id);
  }

  async getRolesWithUsers(companyId: number) {
    const rolesWithUsers =
      await this.rolesRepository.getRolesWithUsers(companyId);

    return rolesWithUsers.map((role) => ({
      id: role.id,
      name: role.name,
      summary: role.summary,
      users: role.user_roles.map((userRole) => ({
        id: userRole.user.id,
        name: userRole.user.details.name,
        profileImage: userRole.user.details.profile_blob
          ? {
              id: userRole.user.details.profile_blob.id,
              name: userRole.user.details.profile_blob.name,
              url: `/blob/${userRole.user.details.profile_blob.id}/view`, // Construct image URL
            }
          : null,
      })),
    }));
  }
}
