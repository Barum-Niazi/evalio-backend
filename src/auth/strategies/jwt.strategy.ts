import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // Inject ConfigService
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Authorization header
      ignoreExpiration: false, // Don't ignore expiration
      secretOrKey: configService.get<string>('JWT_SECRET'), // Fetch JWT secret from environment variables
    });
  }

  async validate(payload: any) {
    // Payload contains the data encoded in the JWT
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
