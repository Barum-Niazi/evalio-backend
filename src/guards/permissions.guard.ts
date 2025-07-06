import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken'; // Import jsonwebtoken to decode the JWT
import { PERMISSIONS_KEY } from '../decorators/permissions.decorators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService, // Inject Prisma service to fetch user permissions
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from route metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // If no permissions are required, allow access
    }

    // Extract the JWT token from the Authorization header
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) {
      throw new ForbiddenException('Authorization token not found');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the JWT token using the secret
    } catch (error) {
      throw new ForbiddenException('Invalid or expired token');
    }

    // The decoded token should have the user data
    const user = decoded; // Extract user data from the decoded token
    // Fetch user roles and permissions from DB
    const userRoles = await this.prisma.user_roles.findMany({
      where: { user_id: user.sub },
      include: {
        role: {
          include: { role_permissions: { include: { permission: true } } },
        },
      },
    });

    const userPermissions = userRoles.flatMap((userRole) =>
      userRole.role.role_permissions.map(
        (rolePerm) => rolePerm.permission.name,
      ),
    );

    // Check if the user has all the required permissions
    const hasPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermissions) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true; // User has all required permissions
  }
}
