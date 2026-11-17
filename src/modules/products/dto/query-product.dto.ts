
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { Trim } from '../../../common/decorators/transforms.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryProductDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'Mustard',
    description: 'Search by product name, SKU or category',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    example: 'cmwkmk3600003bwl9z51momzx',
    description: 'Filter products by branch (Owner only)',
  })
  @IsOptional()
  @Trim()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    example: 'Grocery',
    description: 'Filter products by category',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  category?: string;
}
