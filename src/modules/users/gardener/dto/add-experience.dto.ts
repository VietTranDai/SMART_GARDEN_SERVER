import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class AddExperienceDto {
  @ApiProperty({
    description: 'Experience points to add',
    example: 50,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Min(1)
  points: number;
}
