
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';



import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginationResponse } from '../../common/utils/pagination.util';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

const withCounts = {
  _count: {
    select: {
      users: true,
      products: true,
    },
  },
} as const;

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE BRANCH
  async create(orgId: string, dto: CreateBranchDto) {
    try {
      const branch = await this.prisma.branch.create({
        data: {
          ...dto,
          organizationId: orgId,
        },
        include: withCounts,
      });

      return this.toResponse(branch);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // GET ALL BRANCHES WITH PAGINATION
  async findAll(orgId: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [branches, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where: { organizationId: orgId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: withCounts,
      }),

      this.prisma.branch.count({
        where: { organizationId: orgId },
      }),
    ]);

    return createPaginationResponse(
      branches.map((branch) => this.toResponse(branch)),
      total,
      page,
      limit,
    );
  }

  // GET SINGLE BRANCH
  async findOne(orgId: string, id: string) {
    return this.toResponse(await this.getOwned(orgId, id));
  }

  // UPDATE BRANCH
  async update(orgId: string, id: string, dto: UpdateBranchDto) {
    const result = await this.prisma.branch.updateMany({
      where: {
        id,
        organizationId: orgId,
      },
      data: dto,
    });

    if (result.count === 0) {
      throw new NotFoundException('Branch not found');
    }

    return this.findOne(orgId, id);
  }

  // DELETE BRANCH
  async remove(orgId: string, id: string) {
    const branch = await this.getOwned(orgId, id);

    const { users, products } = branch._count;

    if (users > 0 || products > 0) {
      throw new ConflictException(
        `Cannot delete branch: it still has ${users} staff and ${products} products. Move or remove them first.`,
      );
    }

    try {
      await this.prisma.branch.delete({
        where: { id },
      });

      return { id };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // FIND BRANCH WITH ORGANIZATION ISOLATION
  private async getOwned(orgId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: withCounts,
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  // PRISMA ERROR HANDLING
  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'A branch with this name already exists in your organization',
          );

        case 'P2003':
        case 'P2014':
          throw new ConflictException(
            'Cannot complete this operation because related records exist',
          );

        case 'P2025':
          throw new NotFoundException('Branch not found');
      }
    }

    throw error;
  }

  // RESPONSE FORMAT
  private toResponse<
    T extends {
      _count: {
        users: number;
        products: number;
      };
    },
  >({ _count, ...rest }: T) {
    return {
      ...rest,
      staffCount: _count.users,
      productCount: _count.products,
    };
  }
}
