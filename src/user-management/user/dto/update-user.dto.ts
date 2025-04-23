// src/user/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsInt } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional() @IsInt() roleId?: number;
}
