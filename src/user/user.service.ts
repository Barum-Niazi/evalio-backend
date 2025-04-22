import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import * as argon2 from 'argon2'; // Import Argon2
import { UpdateUserProfileDto } from './dto/user.dto';

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
    const peers = user.details?.manager
      ? await this.userRepository.findPeersByManager(
          user.details.manager.user_id,
          userId,
        )
      : [];

    return {
      id: user.id,
      email: user.auth?.email,
      name: user.details?.name,
      company: user.details?.company,
      department: user.details?.department?.name || null,
      designation: user.details?.designation?.title || null,

      manager: user.details?.manager
        ? {
            user_id: user.details.manager.user_id,
            name: user.details.manager.name,
            profileImage: user.details.manager.profile_blob
              ? {
                  id: user.details.manager.profile_blob.id,
                  name: user.details.manager.profile_blob.name,
                  mimeType: user.details.manager.profile_blob.mime_type,
                  size: user.details.manager.profile_blob.size,
                  url: `/blob/${user.details.manager.profile_blob.id}/view`,
                }
              : null,
          }
        : null,

      subordinates: user.details?.subordinates.map((sub) => ({
        id: sub.user_id,
        name: sub.name,
        profileImage: sub.profile_blob
          ? {
              id: sub.profile_blob.id,
              name: sub.profile_blob.name,
              mimeType: sub.profile_blob.mime_type,
              size: sub.profile_blob.size,
              url: `/blob/${sub.profile_blob.id}/view`,
            }
          : null,
      })),

      peers: peers.map((peer) => ({
        id: peer.user_id,
        name: peer.name,
        profileImage: peer.profile_blob
          ? {
              id: peer.profile_blob.id,
              name: peer.profile_blob.name,
              mimeType: peer.profile_blob.mime_type,
              size: peer.profile_blob.size,
              url: `/blob/${peer.profile_blob.id}/view`,
            }
          : null,
      })),

      profileImage: user.details?.profile_blob
        ? {
            id: user.details.profile_blob.id,
            name: user.details.profile_blob.name,
            mimeType: user.details.profile_blob.mime_type,
            size: user.details.profile_blob.size,
            url: `/blob/${user.details.profile_blob.id}/view`,
          }
        : null,

      roles: user.roles.map((r) => r.role.name),
    };
  }

  async updateUserProfile(userId: number, dto: UpdateUserProfileDto) {
    if (dto.newPassword) {
      const hashed = await argon2.hash(dto.newPassword);
      await this.userRepository.updatePassword(userId, hashed);
    }

    if (dto.name || dto.profileBlobId) {
      await this.userRepository.updateUserDetails(userId, {
        name: dto.name,
        profile_blob_id: dto.profileBlobId,
      });
    }

    return this.getUserProfile(userId);
  }
}
