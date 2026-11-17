
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Permission } from '../../common/constants/permissions.constant';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginationResponse } from '../../common/utils/pagination.util';
import { hashPassword } from '../../common/utils/hash.util';
import {
  assertBranchInOrg,
  assertRoleInOrg,
} from '../../common/utils/tenant.util';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

// Password hash কখনো response-এ যাবে না
const staffSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  role: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE STAFF
  async create(actor: JwtPayload, dto: CreateStaffDto) {
    this.assertCanUseBranch(actor, dto.branchId);

    await assertBranchInOrg(
      this.prisma,
      actor.orgId,
      dto.branchId,
    );

    const role = await assertRoleInOrg(
      this.prisma,
      actor.orgId,
      dto.roleId,
    );

    this.assertCanAssignRole(actor, role.permissions);

    const exists = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
      },
    });

    if (exists) {
      throw new ConflictException('Email is already registered');
    }

    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash: await hashPassword(dto.password),
          organizationId: actor.orgId,
          branchId: dto.branchId,
          roleId: dto.roleId,
        },
        select: staffSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // GET ALL STAFF WITH PAGINATION
  async findAll(
    actor: JwtPayload,
    paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const where = this.scope(actor);

    const [staff, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'asc',
        },
        select: staffSelect,
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return createPaginationResponse(
      staff,
      total,
      page,
      limit,
    );
  }

  // GET SINGLE STAFF
  async findOne(actor: JwtPayload, id: string) {
    return this.getScoped(actor, id);
  }

  // UPDATE STAFF
  async update(
    actor: JwtPayload,
    id: string,
    dto: UpdateStaffDto,
  ) {
    await this.getScoped(actor, id);

    // Validate branch
    if (dto.branchId) {
      this.assertCanUseBranch(actor, dto.branchId);

      await assertBranchInOrg(
        this.prisma,
        actor.orgId,
        dto.branchId,
      );
    }

    // Validate role
    if (dto.roleId) {
      const role = await assertRoleInOrg(
        this.prisma,
        actor.orgId,
        dto.roleId,
      );

      this.assertCanAssignRole(actor, role.permissions);
    }

    const { password, ...rest } = dto;

    try {
      return await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          ...rest,
          ...(password
            ? {
                passwordHash: await hashPassword(password),
              }
            : {}),
        },
        select: staffSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // DELETE STAFF
  async remove(actor: JwtPayload, id: string) {
    if (id === actor.sub) {
      throw new BadRequestException(
        'You cannot delete your own account',
      );
    }

    await this.getScoped(actor, id);

    try {
      await this.prisma.user.delete({
        where: {
          id,
        },
      });

      return { id };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // ORGANIZATION AND BRANCH ISOLATION
  private scope(actor: JwtPayload): Prisma.UserWhereInput {
    return {
      organizationId: actor.orgId,
      isOwner: false,
      ...(actor.isOwner
        ? {}
        : {
            branchId: actor.branchId,
          }),
    };
  }

  // FIND STAFF WITH ACCESS SCOPE
  private async getScoped(actor: JwtPayload, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...this.scope(actor),
      },
      select: staffSelect,
    });

    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    return user;
  }

  // MANAGER CAN ONLY USE OWN BRANCH
  private assertCanUseBranch(
    actor: JwtPayload,
    branchId: string,
  ) {
    if (
      !actor.isOwner &&
      branchId !== actor.branchId
    ) {
      throw new ForbiddenException(
        'You can only manage staff in your own branch',
      );
    }
  }

  // ROLE PERMISSION VALIDATION
  private assertCanAssignRole(
    actor: JwtPayload,
    rolePermissions: Permission[],
  ) {
    if (actor.isOwner) return;

    const canAssign = rolePermissions.every((permission) =>
      actor.permissions.includes(permission),
    );

    if (!canAssign) {
      throw new ForbiddenException(
        'You cannot assign a role with more permissions than your own',
      );
    }
  }

  // PRISMA ERROR HANDLING
  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'Email is already registered',
          );

        case 'P2003':
        case 'P2014':
          throw new ConflictException(
            'Cannot complete this operation because related records exist',
          );

        case 'P2025':
          throw new NotFoundException(
            'Staff member not found',
          );
      }
    }

    throw error;
  }
}
