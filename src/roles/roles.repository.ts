// roles.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@Injectable()
export class RolesRepository {
  constructor(private prisma: PrismaService) {}

  // Create a new role
  async createRole(createRoleDto: CreateRoleDto, createdBy: number) {
    return this.prisma.roles.create({
      data: {
        name: createRoleDto.name,
        summary: createRoleDto.summary,
        created_by: createdBy,
      },
    });
  }

  // Update an existing role
  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.roles.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async getPermissionsByNames(permissionNames: string[]) {
    const permissions = await this.prisma.permissions.findMany({
      where: {
        name: { in: permissionNames },
      },
    });

    return permissions.map((permission) => permission.id); // Return the permission IDs
  }

  // Assign permissions to a role by their IDs
  async assignPermissionsToRole(roleId: number, permissionIds: number[]) {
    const rolePermissions = permissionIds.map((permissionId) => ({
      role_id: roleId,
      permission_id: permissionId,
    }));

    return this.prisma.role_permissions.createMany({
      data: rolePermissions,
      skipDuplicates: true, // Skip if a role-permission entry already exists
    });
  }
  // Assign users to a role
  async assignUsersToRole(roleId: number, userIds: number[]) {
    const userRoles = userIds.map((userId) => ({
      role_id: roleId,
      user_id: userId,
    }));

    return this.prisma.user_roles.createMany({
      data: userRoles,
      skipDuplicates: true, // Prevent duplicate user-role entries
    });
  }

  async getAllRoles() {
    const roles = await this.prisma.roles.findMany({
      include: {
        role_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      summary: role.summary,
      created_by: role.created_by,
      audit: role.audit,
      permissions_count: role.role_permissions.length,
      permissions: role.role_permissions.map((rolePerm) => ({
        name: rolePerm.permission.name,
        label: rolePerm.permission.label,
      })),
    }));
  }

  async getRoleById(id: number) {
    const role = await this.prisma.roles.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: {
            permission: true, // Include permission data
          },
        },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      summary: role.summary,
      created_by: role.created_by,
      audit: role.audit,
      permissions_count: role.role_permissions.length,
      permissions: role.role_permissions.map((rolePerm) => ({
        name: rolePerm.permission.name,
        label: rolePerm.permission.label,
      })),
    };
  }
  // Delete a role
  async deleteRole(id: number) {
    //  Delete role_permissions
    await this.prisma.role_permissions.deleteMany({
      where: { role_id: id },
    });

    //  Delete user_roles
    await this.prisma.user_roles.deleteMany({
      where: { role_id: id },
    });

    // delete the role itself
    return this.prisma.roles.delete({
      where: { id },
    });
  }

  async getRolesWithUsers() {
    return this.prisma.roles.findMany({
      include: {
        user_roles: {
          include: {
            user: {
              select: {
                id: true,
                details: {
                  select: {
                    name: true,
                    profile_blob: true, // Fetch profile image data
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
