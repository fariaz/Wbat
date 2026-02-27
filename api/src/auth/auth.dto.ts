import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
