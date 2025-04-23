// src/user/dto/create-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty() @IsString() username: string;
  @IsNotEmpty() @IsString() firstName: string;
  @IsNotEmpty() @IsString() lastName: string;
  @IsNotEmpty() @IsEmail() email: string;
  @IsNotEmpty() @IsString() password: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsDateString() dateOfBirth?: Date;
  @IsNotEmpty() @IsInt() roleId: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() profilePicture?: string;
}
