import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsPositive } from 'class-validator';

export class CreateExperienceLevelDto {
  @ApiProperty({
    description: 'Level number (e.g. 1, 2, 3)',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  level: number;

  @ApiProperty({
    description: 'Minimum experience points required for this level',
    example: 0,
  })
  @IsInt()
  @Min(0)
  minXP: number;

  @ApiProperty({
    description: 'Maximum experience points for this level',
    example: 99,
  })
  @IsInt()
  @IsPositive()
  maxXP: number;

  @ApiProperty({
    description: 'Title for this experience level',
    example: 'Beginner Gardener',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Description of this experience level',
    example: 'Just starting your gardening journey',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Icon representing this level',
    example: '🌱',
  })
  @IsString()
  @IsNotEmpty()
  icon: string;
}
