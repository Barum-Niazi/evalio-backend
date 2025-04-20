import { Injectable } from '@nestjs/common';
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

  async createEmployee(
    name: string,
    email: string,
    password: string,
    companyId: number,
  ) {
    const hashedPassword = await argon2.hash(password);
    return this.userRepository.createEmployee(
      name,
      email,
      hashedPassword,
      companyId,
    );
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
}
