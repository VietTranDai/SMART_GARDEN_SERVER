import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({ description: 'Role ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Role name', example: 'GARDENER' })
  name: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Regular user with gardening capabilities',
  })
  description?: string;
}

export class UserDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-01' })
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Role ID', example: 1 })
  roleId: number;

  @ApiProperty({ description: 'Role information', type: RoleDto })
  role: RoleDto;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St, City' })
  address?: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Garden enthusiast from New York',
  })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/avatars/johndoe.jpg',
  })
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLogin?: Date;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Account last update timestamp' })
  updatedAt: Date;
}
