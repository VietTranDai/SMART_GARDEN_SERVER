// src/user/dto/user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { mapToRoleDto, RoleDto } from '../../role/dto/role.dto';
import { Role, User } from '@prisma/client';

export class UserDto {
  @ApiProperty({ description: 'Unique user ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Username for login', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'First name of the user', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (ISO 8601)',
    example: '1990-01-01',
  })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'URL of profile picture',
    example: 'https://example.com/avatars/johndoe.jpg',
  })
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'Residential address',
    example: '123 Main St, Springfield',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'Short biography or user description',
    example: 'Garden enthusiast and full-stack dev',
  })
  bio?: string;

  @ApiProperty({ description: 'Foreign key to Role', example: 2 })
  roleId: number;

  @ApiProperty({
    description: 'Full role details',
    type: () => RoleDto,
  })
  role: RoleDto;

  @ApiPropertyOptional({
    description: 'Timestamp of last login (ISO 8601)',
    example: '2025-05-01T14:30:00Z',
  })
  lastLogin?: string;

  @ApiProperty({
    description: 'Account creation timestamp (ISO 8601)',
    example: '2024-01-15T08:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Account last update timestamp (ISO 8601)',
    example: '2025-04-29T12:45:00Z',
  })
  updatedAt: string;
}

export function mapToUserDto(user: User & { role: Role }): UserDto {
  const dto = new UserDto();
  dto.id = user.id;
  dto.username = user.username;
  dto.firstName = user.firstName;
  dto.lastName = user.lastName;
  dto.email = user.email;
  dto.phoneNumber = user.phoneNumber ?? undefined;
  // Chỉ lấy phần ngày (YYYY-MM-DD)
  dto.dateOfBirth = user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : undefined;
  dto.profilePicture = user.profilePicture ?? undefined;
  dto.address = user.address ?? undefined;
  dto.bio = user.bio ?? undefined;

  dto.roleId = user.roleId;
  dto.role = mapToRoleDto(user.role);

  dto.lastLogin = user.lastLogin ? user.lastLogin.toISOString() : undefined;
  dto.createdAt = user.createdAt.toISOString();
  dto.updatedAt = user.updatedAt.toISOString();

  return dto;
}
