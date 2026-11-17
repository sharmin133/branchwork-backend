
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  Permission,
  Prisma,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

import {
  comparePassword,
  hashPassword,
} from '../../common/utils/hash.util';

import {
  generateRefreshToken,
  hashRefreshToken,
} from '../../common/utils/refresh-token.util';

const userInclude = {
  organization: true,
  branch: true,
  role: true,
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Register Organization and Owner
  async registerOrganization(dto: RegisterOrganizationDto) {
    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        isOwner: true,
        organization: {
          create: {
            name: dto.organizationName,
          },
        },
      },
      include: userInclude,
    });

    return this.buildAuthResponse(user);
  }

  // Login Owner or Staff
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      include: userInclude,
    });

    const valid =
      user &&
      (await comparePassword(dto.password, user.passwordHash));

    if (!user || !valid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    return this.buildAuthResponse(user);
  }

  // Refresh Access Token and Rotate Refresh Token
  async refresh(dto: RefreshTokenDto) {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const now = new Date();

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);

    const expiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const expiresAt = new Date(
      now.getTime() + this.parseDuration(expiresIn),
    );

    const user = await this.prisma.$transaction(
      async (tx) => {
        const revoked = await tx.refreshToken.updateMany({
          where: {
            tokenHash,
            revokedAt: null,
            expiresAt: {
              gt: now,
            },
          },
          data: {
            revokedAt: now,
          },
        });

        if (revoked.count !== 1) {
          throw new UnauthorizedException(
            'Invalid, expired, or already used refresh token',
          );
        }

        const storedToken =
          await tx.refreshToken.findUnique({
            where: {
              tokenHash,
            },
            include: {
              user: {
                include: userInclude,
              },
            },
          });

        if (!storedToken) {
          throw new UnauthorizedException(
            'User not found',
          );
        }

        await tx.refreshToken.create({
          data: {
            tokenHash: newTokenHash,
            userId: storedToken.userId,
            expiresAt,
          },
        });

        return storedToken.user;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return {
      accessToken: this.jwt.sign({
        sub: user.id,
      }),
      refreshToken: newRefreshToken,
      user: this.toProfile(user),
    };
  }

  // Logout and Revoke Refresh Token
  async logout(userId: string, dto: LogoutDto) {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const now = new Date();

    const result = await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        userId,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });

    if (result.count === 0) {
      throw new UnauthorizedException(
        'Invalid or already revoked refresh token',
      );
    }

    return {
      message: 'Logged out successfully',
    };
  }

  // Get Current User Profile
  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      include: userInclude,
    });

    return this.toProfile(user);
  }

  // Generate Access Token and Refresh Token
  private async buildAuthResponse(user: UserWithRelations) {
    const accessToken = this.jwt.sign({
      sub: user.id,
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);

    const expiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const expiresAt = new Date(
      Date.now() + this.parseDuration(expiresIn),
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toProfile(user),
    };
  }

  // Convert Duration into Milliseconds
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error(
        'Invalid JWT_REFRESH_EXPIRES_IN format',
      );
    }

    const value = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }

  // Format User Profile
  private toProfile(user: UserWithRelations) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isOwner: user.isOwner,

      organization: {
        id: user.organization.id,
        name: user.organization.name,
      },

      branch: user.branch
        ? {
            id: user.branch.id,
            name: user.branch.name,
          }
        : null,

      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
          }
        : null,

      permissions: user.isOwner
        ? Object.values(Permission)
        : (user.role?.permissions ?? []),
    };
  }
}
