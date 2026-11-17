
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  Lowercase,
  Trim,
} from '../../../common/decorators/transforms.decorator';

export class CreateStaffDto {
  @ApiProperty({
    example: 'Rafi Ahmed',
    description: 'Staff full name',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'rafi@demo.com',
    description: 'Staff email address',
  })
  @Lowercase()
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'demo123',
    description: 'Staff password',
    minLength: 6,
    maxLength: 72,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    example: 'cmwkmk3600003bwl9z51momzx',
    description: 'Branch ID assigned to staff',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({
    example: 'cmwkk62np0003r0l9ih2c0f0d',
    description: 'Role ID assigned to staff',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
