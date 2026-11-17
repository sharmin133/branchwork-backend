
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Permission } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OwnerOnly } from '../../common/decorators/owner-only.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

import { CreateProductDto } from './dto/create-product.dto';
import { OrganizeProductDto } from './dto/organize-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  // GET ALL PRODUCTS
  @Get()
  @RequirePermissions(Permission.VIEW_PRODUCTS)
  @ApiOperation({
    summary: 'Get products with search, filters and pagination',
  })
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findAll(actor, query);
  }

  // GET SINGLE PRODUCT
  @Get(':id')
  @RequirePermissions(Permission.VIEW_PRODUCTS)
  @ApiOperation({
    summary: 'Get a single product',
  })
  findOne(
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(actor, id);
  }

  // CREATE PRODUCT (OWNER ONLY)
  @Post()
  @OwnerOnly()
  @ApiOperation({
    summary: 'Create a new product',
  })
  create(
    @CurrentUser() actor: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(actor, dto);
  }

  // FULL UPDATE PRODUCT (OWNER ONLY)
  @Patch(':id')
  @OwnerOnly()
  @ApiOperation({
    summary: 'Update product details',
  })
  update(
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(actor, id, dto);
  }

  // ORGANIZE PRODUCT (STAFF WITH PERMISSION)
  @Patch(':id/organize')
  @RequirePermissions(Permission.ORGANIZE_PRODUCTS)
  @ApiOperation({
    summary: 'Update product category, stock or branch',
  })
  organize(
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
    @Body() dto: OrganizeProductDto,
  ) {
    return this.productsService.organize(actor, id, dto);
  }

  // DELETE PRODUCT (OWNER ONLY)
  @Delete(':id')
  @OwnerOnly()
  @ApiOperation({
    summary: 'Delete a product',
  })
  remove(
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(actor, id);
  }
}
