import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import * as argon2 from 'argon2'; // Import Argon2

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async createAdmin(name: string, email: string, password: string) {
    const hashedPassword = await argon2.hash(password);
    return this.userRepository.createAdmin(name, email, hashedPassword);
  }

  async findCompanyUsers(companyId: number) {
    return this.userRepository.findCompanyUsers(companyId);
  }

  async storeGoogleTokens(
    userId: number,
    tokens: { access_token: string; refresh_token: string },
  ) {
    return this.userRepository.updateGoogleTokens(userId, tokens);
  }

  async getUserProfile(userId: number) {
    const user = await this.userRepository.getUserProfileById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.auth?.email,
      name: user.details?.name,
      company: user.details?.company,
      department: user.details?.department?.name || null,
      designation: user.details?.designation?.title || null,
      manager: user.details?.manager || null,
      profileImage: user.details?.profile_blob
        ? {
            id: user.details.profile_blob.id,
            name: user.details.profile_blob.name,
            mimeType: user.details.profile_blob.mime_type,
            size: user.details.profile_blob.size,
          }
        : null,
      roles: user.roles.map((r) => r.role.name),
    };
  }
}
