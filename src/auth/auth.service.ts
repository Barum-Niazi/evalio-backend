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

  async signUp(
    name: string,
    email: string,
    password: string,
    companyName: string,
  ): Promise<any> {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    await this.userService.createAdmin(name, email, password, companyName);

    return { message: 'Admin user successfully created' };
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

    const role = user.roles[0]?.role?.name || 'Unknown';

    return {
      id: user.id,
      email: userAuth.email,
      role,
      company_id: user.details?.company_id,
    };
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    };
    console.log(payload);
    return {
      id: user.id,
      role: user.role,
      access_token: this.jwtService.sign(payload),
      company_id: user.company_id,
    };
  }
}
