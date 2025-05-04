import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

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

export function mapToRoleDto (role: Role): RoleDto {
  const dto = new RoleDto();

  dto.id = role.id;
  dto.name = role.name;
  dto.description = role.description ?? undefined;

  return dto;
}