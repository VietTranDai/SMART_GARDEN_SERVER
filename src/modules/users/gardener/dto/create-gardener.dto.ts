import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateGardenerDto {
  @ApiProperty({
    description: 'User ID associated with this gardener',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiPropertyOptional({
    description: 'Initial experience points',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  experiencePoints?: number = 0;

  @ApiProperty({
    description: 'Experience level ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  experienceLevelId: number;
}
