
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { OWNER_ONLY_KEY } from '../decorators/owner-only.decorator';
import { Permission } from '../constants/permissions.constant';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];

    // 1. Public routes don't need authentication or permission checks.
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );

    if (isPublic) return true;

    // 2. Get authenticated user from request.
    const user = ctx.switchToHttp().getRequest().user as
      | JwtPayload
      | undefined;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // 3. Organization owner has full access.
    if (user.isOwner) return true;

    // 4. Check whether the route is owner-only.
    const ownerOnly = this.reflector.getAllAndOverride<boolean>(
      OWNER_ONLY_KEY,
      targets,
    );

    if (ownerOnly) {
      throw new ForbiddenException(
        'Only the organization owner can perform this action',
      );
    }

    // 5. Get required permissions for the route.
    const requiredPermissions = this.reflector.getAllAndOverride<
      Permission[]
    >(PERMISSIONS_KEY, targets);

    // 6. No special permission required.
    if (!requiredPermissions?.length) return true;

    // 7. Check whether the user has all required permissions.
    const hasPermission = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
