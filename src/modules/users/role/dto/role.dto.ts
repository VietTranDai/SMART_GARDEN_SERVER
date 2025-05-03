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