
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { Trim } from '../../../common/decorators/transforms.decorator';

export class OrganizeProductDto {
  @ApiPropertyOptional({
    example: 'Grocery',
    description: 'Update product category',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Update available stock',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: 'cmwkmk3600003bwl9z51momzx',
    description: 'Branch ID (must belong to the staff member)',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  branchId?: string;
}
