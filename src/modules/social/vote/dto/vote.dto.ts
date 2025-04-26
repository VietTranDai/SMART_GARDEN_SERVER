import { ApiProperty } from '@nestjs/swagger';
import { VoteTargetType } from '@prisma/client';

export class VoteDto {
  @ApiProperty({ description: 'ID của người bình chọn', example: 1 })
  gardenerId: number;

  @ApiProperty({
    description: 'Loại đối tượng (POST hoặc COMMENT)',
    enum: VoteTargetType,
    example: 'POST',
  })
  targetType: VoteTargetType;

  @ApiProperty({ description: 'ID của đối tượng được bình chọn', example: 1 })
  targetId: number;

  @ApiProperty({
    description: 'Giá trị bình chọn (1: upvote, -1: downvote)',
    example: 1,
  })
  voteValue: number;
}
