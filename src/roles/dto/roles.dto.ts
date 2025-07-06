// create-role.dto.ts
import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string; // e.g., "admin", "viewer"

  @IsOptional()
  @IsString()
  summary?: string; // Human-readable summary like "Full Access"
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string; // Role name, e.g., "admin", "manager"

  @IsOptional()
  @IsString()
  summary?: string; // Update the role's summary
}

export class AssignPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissionNames: string[]; // Array of permission names (e.g., 'view_feedback', 'create_meeting')
}

export class AssignUsersDto {
  @IsArray()
  @IsInt({ each: true })
  userIds: number[]; // Array of user IDs to assign to the role
}
