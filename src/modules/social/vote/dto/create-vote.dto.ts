import { ApiProperty } from '@nestjs/swagger';
import { VoteTargetType } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateVoteDto {
  @ApiProperty({
    description: 'Loại đối tượng (POST hoặc COMMENT)',
    enum: VoteTargetType,
    example: 'POST',
  })
  @IsNotEmpty()
  @IsEnum(VoteTargetType)
  targetType: VoteTargetType;

  @ApiProperty({ description: 'ID của đối tượng được bình chọn', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  targetId: number;

  @ApiProperty({
    description: 'Giá trị bình chọn (1: upvote, -1: downvote)',
    example: 1,
  })
  @IsNotEmpty()
  @IsIn([1, -1])
  voteValue: number;
}
