
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

import { Trim } from '../../../common/decorators/transforms.decorator';

export class CreateBranchDto {
  @ApiProperty({
    example: 'Gulshan',
    description: 'Branch name',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Dhaka',
    description: 'Branch city',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;
}
