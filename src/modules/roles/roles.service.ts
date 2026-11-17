import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import {
  PERMISSION_LABELS,
  Permission,
} from '../../common/constants/permissions.constant';

import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginationResponse } from '../../common/utils/pagination.util';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

// Count assigned staff
const withCounts = {
  _count: {
    select: {
      users: true,
    },
  },
} as const;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // GET AVAILABLE PERMISSIONS
//   listPermissions() {
//     return Object.values(Permission).map((key) => ({
//       key,
//       label: PERMISSION_LABELS[key],
//     }));
//   }

  // CREATE ROLE
  async create(orgId: string, dto: CreateRoleDto) {
    try {
      const role = await this.prisma.role.create({
        data: {
          ...dto,
          organizationId: orgId,
        },
        include: withCounts,
      });

      return this.toResponse(role);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  // GET ALL ROLES WITH PAGINATION
  async findAll(orgId: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where: {
          organizationId: orgId,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'asc',
        },
        include: withCounts,
      }),

      this.prisma.role.count({
        where: {
          organizationId: orgId,
        },
      }),
    ]);

    return createPaginationResponse(
      roles.map((role) => this.toResponse(role)),
      total,
      page,
      limit,
    );
  }

  // GET SINGLE ROLE
  async findOne(orgId: string, id: string) {
    const role = await this.getOwned(orgId, id);

    return this.toResponse(role);
  }

  // UPDATE ROLE
  async update(orgId: string, id: string, dto: UpdateRoleDto) {
    try {
      const result = await this.prisma.role.updateMany({
        where: {
          id,
          organizationId: orgId,
        },
        data: dto,
      });

      if (result.count === 0) {
        throw new NotFoundException('Role not found');
      }

      return this.findOne(orgId, id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      return this.handlePrismaError(error);
    }
  }

  // DELETE ROLE
  async remove(orgId: string, id: string) {
    const role = await this.getOwned(orgId, id);

    // Assigned staff thakle delete block
    if (role._count.users > 0) {
      throw new ConflictException(
        `Cannot delete role: ${role._count.users} staff member(s) are assigned to it. Reassign them first.`,
      );
    }

    try {
      const result = await this.prisma.role.deleteMany({
        where: {
          id,
          organizationId: orgId,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Role not found');
      }

      return { id };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      return this.handlePrismaError(error);
    }
  }

  // FIND ROLE WITH ORGANIZATION ISOLATION
  private async getOwned(orgId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: withCounts,
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  // PRISMA ERROR HANDLING
  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'A role with this name already exists in your organization',
          );

        case 'P2003':
        case 'P2014':
          throw new ConflictException(
            'Cannot complete this operation because related records exist',
          );

        case 'P2025':
          throw new NotFoundException('Role not found');
      }
    }

    throw error;
  }

  // RESPONSE FORMAT
  private toResponse<
    T extends {
      _count: {
        users: number;
      };
    },
  >({ _count, ...rest }: T) {
    return {
      ...rest,
      staffCount: _count.users,
    };
  }
}