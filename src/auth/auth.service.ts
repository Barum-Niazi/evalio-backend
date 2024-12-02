import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';

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

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userService.createAdmin(
      name,
      email,
      hashedPassword,
      companyName,
    );

    return { message: 'Admin user successfully created' };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const userAuth = await this.userService.findByEmail(email);

    if (!userAuth) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate the password
    const isPasswordValid = await bcrypt.compare(password, userAuth.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Extract the user object and roles
    const { user } = userAuth;

    if (!user || !user.roles || user.roles.length === 0) {
      throw new UnauthorizedException('User has no assigned role');
    }

    // Extract the first role name
    const role = user.roles[0]?.role?.name || 'Unknown'; // Handle missing role gracefully

    return {
      id: user.id,
      email: userAuth.email,
      role: role,
    };
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    console.log(payload);
    return {
      role: user.role,
      access_token: this.jwtService.sign(payload),
    };
  }
}
