import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

import { Permission } from '../../../common/constants/permissions.constant';
import { Trim } from '../../../common/decorators/transforms.decorator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Stock Clerk',
    description: 'Role name',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @ApiProperty({
    enum: Permission,
    isArray: true,
    example: [
      Permission.VIEW_PRODUCTS,
      Permission.ORGANIZE_PRODUCTS,
    ],
    description: 'Permissions assigned to this role',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions!: Permission[];
}