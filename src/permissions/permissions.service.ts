import { Injectable } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  // Get all permissions
  async getAllPermissions() {
    return this.permissionsRepository.getAllPermissions();
  }
}
