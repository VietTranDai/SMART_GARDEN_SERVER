import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateFollowDto {
  @ApiProperty({
    description: 'ID của người làm vườn được theo dõi',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  followedId: number;
}
