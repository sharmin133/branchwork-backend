import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

 
  async validate(payload: { sub: string }): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        organizationId: true,
        isOwner: true,
        branchId: true,
        role: { select: { permissions: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User no longer exists');

    return {
      sub: user.id,
      orgId: user.organizationId,
      isOwner: user.isOwner,
      branchId: user.branchId,
      permissions: user.role?.permissions ?? [],
    };
  }
}