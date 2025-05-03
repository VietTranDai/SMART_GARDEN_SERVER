import { ApiProperty } from '@nestjs/swagger';

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
