import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'somchai.p@dev.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'devpassword' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refresh_token!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  display_name!: string;

  @ApiProperty({ enum: ['sales', 'manager', 'admin', 'auditor'] })
  role!: string;
}

export class LoginResponseDto {
  @ApiProperty()
  access_token!: string;

  @ApiProperty()
  refresh_token!: string;

  @ApiProperty({ example: 3600 })
  expires_in!: number;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
