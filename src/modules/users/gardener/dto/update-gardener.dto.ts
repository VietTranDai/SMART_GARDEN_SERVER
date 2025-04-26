import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateGardenerDto {
  @ApiPropertyOptional({
    description: 'Experience points',
    example: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  experiencePoints?: number;

  @ApiPropertyOptional({
    description: 'Experience level ID',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  experienceLevelId?: number;
}
