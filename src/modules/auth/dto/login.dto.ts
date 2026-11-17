import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Lowercase } from '../../../common/decorators/transforms.decorator';

export class LoginDto {
  @ApiProperty({ example: 'owner@demo.com' })
  @Lowercase() @IsEmail()
  email: string;

  @ApiProperty({ example: 'demo123' })
  @IsString() @IsNotEmpty()
  password: string;
}