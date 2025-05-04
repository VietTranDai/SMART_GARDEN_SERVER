import { ApiProperty } from '@nestjs/swagger';
import { ExperienceLevel } from '@prisma/client';

export class ExperienceLevelDto {
  @ApiProperty({
    description: 'Experience level ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Level number (e.g. 1, 2, 3)',
    example: 1,
  })
  level: number;

  @ApiProperty({
    description: 'Minimum experience points required for this level',
    example: 0,
  })
  minXP: number;

  @ApiProperty({
    description: 'Maximum experience points for this level',
    example: 0,
  })
  maxXP: number;

  @ApiProperty({
    description: 'Title for this experience level',
    example: 'Beginner Gardener',
  })
  title: string;

  @ApiProperty({
    description: 'Description of this experience level',
    example: 'Just starting your gardening journey',
  })
  description: string;

  @ApiProperty({
    description: 'Icon representing this level',
    example: '🌱',
  })
  icon: string;
}

/**
 * Chuyển đổi entity ExperienceLevel thành ExperienceLevelDto
 */
export function mapToExperienceLevelDto(
  level: ExperienceLevel
): ExperienceLevelDto {
  const dto = new ExperienceLevelDto();
  dto.id = level.id;
  dto.level = level.level;
  dto.minXP = level.minXP;
  dto.maxXP = level.maxXP;
  dto.title = level.title;
  dto.description = level.description;
  dto.icon = level.icon;
  return dto;
}
