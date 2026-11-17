import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Lowercase, Trim } from '../../../common/decorators/transforms.decorator';

export class RegisterOrganizationDto {
  @ApiProperty({ example: 'Padma Retail' })
  @Trim() @IsString() @IsNotEmpty() @MaxLength(100)
  organizationName: string;

  @ApiProperty({ example: 'Nadia Rahman' })
  @Trim() @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'owner@demo.com' })
  @Lowercase() @IsEmail()
  email: string;

  @ApiProperty({ example: 'demo123', minLength: 6 })
  @IsString() @MinLength(6) @MaxLength(72) // bcrypt limit 72 bytes
  password: string;
}