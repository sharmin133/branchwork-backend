
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { createPaginationResponse } from '../../common/utils/pagination.util';
import { assertBranchInOrg } from '../../common/utils/tenant.util';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { OrganizeProductDto } from './dto/organize-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const LOW_STOCK_THRESHOLD = 10;

const productInclude = {
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ProductInclude;

type ProductWithBranch = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE PRODUCT (OWNER)
  async create(actor: JwtPayload, dto: CreateProductDto) {
    await assertBranchInOrg(this.prisma, actor.orgId, dto.branchId);

    try {
      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          sku: dto.sku,
          category: dto.category,
          price: dto.price,
          stock: dto.stock,
          branchId: dto.branchId,
          organizationId: actor.orgId,
        },
        include: productInclude,
      });

      return this.toResponse(product);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // GET ALL PRODUCTS WITH SEARCH, FILTER AND PAGINATION
  async findAll(actor: JwtPayload, query: QueryProductDto) {
    const { page, limit } = query;

    // OWNER CAN FILTER ANY BRANCH OF OWN ORGANIZATION
    if (actor.isOwner && query.branchId) {
      await assertBranchInOrg(
        this.prisma,
        actor.orgId,
        query.branchId,
      );
    }

    // STAFF CAN ONLY ACCESS OWN BRANCH
    if (
      !actor.isOwner &&
      query.branchId &&
      query.branchId !== actor.branchId
    ) {
      throw new ForbiddenException(
        'You can only access products from your own branch',
      );
    }

    const where: Prisma.ProductWhereInput = {
      ...this.scope(actor),

      ...(actor.isOwner && query.branchId
        ? { branchId: query.branchId }
        : {}),

      ...(query.category
        ? {
            category: {
              equals: query.category,
              mode: 'insensitive',
            },
          }
        : {}),

      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                sku: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                category: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.product.count({ where }),
    ]);

    return createPaginationResponse(
      products.map((product) => this.toResponse(product)),
      total,
      page,
      limit,
    );
  }

  // GET SINGLE PRODUCT
  async findOne(actor: JwtPayload, id: string) {
    const product = await this.getScoped(actor, id);

    return this.toResponse(product);
  }

  // UPDATE PRODUCT (OWNER FULL EDIT)
  async update(
    actor: JwtPayload,
    id: string,
    dto: UpdateProductDto,
  ) {
    await this.getScoped(actor, id);

    if (dto.branchId) {
      await assertBranchInOrg(
        this.prisma,
        actor.orgId,
        dto.branchId,
      );
    }

    try {
      const result = await this.prisma.product.updateMany({
        where: {
          id,
          organizationId: actor.orgId,
        },
        data: dto,
      });

      if (result.count === 0) {
        throw new NotFoundException('Product not found');
      }

      const product = await this.getScoped(actor, id);

      return this.toResponse(product);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // ORGANIZE PRODUCT (STAFF)
  async organize(
    actor: JwtPayload,
    id: string,
    dto: OrganizeProductDto,
  ) {
    if (
      dto.category === undefined &&
      dto.stock === undefined &&
      dto.branchId === undefined
    ) {
      throw new BadRequestException(
        'Provide at least one of: category, stock, branchId',
      );
    }

    await this.getScoped(actor, id);

    // STAFF CANNOT MOVE PRODUCT TO ANOTHER BRANCH
    if (
      dto.branchId &&
      !actor.isOwner &&
      dto.branchId !== actor.branchId
    ) {
      throw new ForbiddenException(
        'You cannot move products to another branch',
      );
    }

    if (dto.branchId) {
      await assertBranchInOrg(
        this.prisma,
        actor.orgId,
        dto.branchId,
      );
    }

    try {
      const result = await this.prisma.product.updateMany({
        where: {
          id,
          ...this.scope(actor),
        },
        data: {
          ...(dto.category !== undefined
            ? { category: dto.category }
            : {}),
          ...(dto.stock !== undefined
            ? { stock: dto.stock }
            : {}),
          ...(dto.branchId !== undefined
            ? { branchId: dto.branchId }
            : {}),
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Product not found');
      }

      const product = await this.getScoped(actor, id);

      return this.toResponse(product);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // DELETE PRODUCT (OWNER)
  async remove(actor: JwtPayload, id: string) {
    await this.getScoped(actor, id);

    try {
      const result = await this.prisma.product.deleteMany({
        where: {
          id,
          organizationId: actor.orgId,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('Product not found');
      }

      return { id };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // ORGANIZATION AND BRANCH SCOPE
  private scope(actor: JwtPayload): Prisma.ProductWhereInput {
    return {
      organizationId: actor.orgId,

      ...(actor.isOwner
        ? {}
        : {
            branchId: actor.branchId ?? '__no_branch_assigned__',
          }),
    };
  }

  // FIND PRODUCT WITH TENANT SCOPE
  private async getScoped(
    actor: JwtPayload,
    id: string,
  ): Promise<ProductWithBranch> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        ...this.scope(actor),
      },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // CONVERT DECIMAL AND ADD LOW STOCK STATUS
  private toResponse(product: ProductWithBranch) {
    return {
      ...product,
      price: product.price.toNumber(),
      lowStock: product.stock <= LOW_STOCK_THRESHOLD,
    };
  }

  // PRISMA ERROR HANDLING
  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'A product with this SKU already exists in your organization',
          );

        case 'P2003':
        case 'P2014':
          throw new ConflictException(
            'Cannot complete this operation because related records exist',
          );

        case 'P2025':
          throw new NotFoundException('Product not found');
      }
    }

    throw error;
  }
}
