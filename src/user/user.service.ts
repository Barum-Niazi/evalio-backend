import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async createAdmin(
    name: string,
    email: string,
    password: string,
    companyName: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userRepository.createAdmin(
      name,
      email,
      hashedPassword,
      companyName,
    );
  }
}
