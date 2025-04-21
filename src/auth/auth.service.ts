import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as argon2 from 'argon2'; // Import Argon2

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(name: string, email: string, password: string): Promise<any> {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const newUser = await this.userService.createAdmin(name, email, password);

    // Generate a JWT token for the new admin user
    const payload = {
      sub: newUser.id,
      email: newUser.auth.email,
      role: 'Admin',
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Admin user successfully created',
      access_token: token,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const userAuth = await this.userService.findByEmail(email);

    if (!userAuth) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(userAuth.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { user } = userAuth;

    if (!user || !user.roles || user.roles.length === 0) {
      throw new UnauthorizedException('User has no assigned role');
    }

    const roles = user.roles.map((ur) => ur.role.name); // Extract role names

    return {
      id: user.id,
      email: userAuth.email,
      roles,
      companyId: user.details?.company_id,
    };
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles, // ✅ This is now an array
      companyId: user.companyId,
    };

    return {
      id: user.id,
      roles: user.roles,
      access_token: this.jwtService.sign(payload),
      companyId: user.companyId,
    };
  }

  async storeGoogleTokens(
    userId: number,
    tokens: { access_token: string; refresh_token: string },
  ): Promise<void> {
    await this.userService.storeGoogleTokens(userId, tokens);
  }
}
