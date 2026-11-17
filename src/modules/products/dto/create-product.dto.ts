
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  Trim,
  Uppercase,
} from '../../../common/decorators/transforms.decorator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Mustard Oil 1L',
    description: 'Product name',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    example: 'OIL-001',
    description: 'Unique product SKU within the organization',
  })
  @Uppercase()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku!: string;

  @ApiProperty({
    example: 'Grocery',
    description: 'Product category',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category!: string;

  @ApiProperty({
    example: 420,
    description: 'Product price',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({
    example: 48,
    description: 'Available stock quantity',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({
    example: 'cmwkmk3600003bwl9z51momzx',
    description: 'Branch ID where the product will be assigned',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  branchId!: string;
}
