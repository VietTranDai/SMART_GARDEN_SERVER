import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleDto } from '../../role/dto/role.dto';
import { ExperienceLevelDto } from '../../experience_level';

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
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/avatars/johndoe.jpg',
  })
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St, City' })
  address?: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Garden enthusiast from New York',
  })
  bio?: string;

  @ApiProperty({ description: 'Role ID', example: 1 })
  roleId: number;

  @ApiProperty({ description: 'Role information', type: RoleDto })
  role: RoleDto;

  @ApiProperty({
    description: 'Indicates if the user has admin privileges',
    example: false,
  })
  isAdmin: boolean;

  @ApiProperty({
    description: 'Indicates if the user is a gardener',
    example: true,
  })
  isGardener: boolean;

  @ApiProperty({
    description: 'Experience points accumulated by the user',
    example: 150,
  })
  experiencePoints: number;

  @ApiProperty({
    description: 'Experience level details',
    type: ExperienceLevelDto,
  })
  experienceLevel: ExperienceLevelDto;

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2025-05-01T14:30:00Z',
  })
  lastLogin?: Date;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-15T08:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Account last update timestamp',
    example: '2025-04-29T12:45:00Z',
  })
  updatedAt: Date;
}
