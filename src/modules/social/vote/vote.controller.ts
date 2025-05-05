import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { VoteService } from './vote.service';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CreateVoteDto } from './dto/vote.dto';

@ApiTags('Vote')
@Controller('vote')
@ApiBearerAuth()
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post('posts/:postId')
  @ApiOperation({ summary: 'Vote on a post' })
  @ApiParam({ name: 'postId', required: true, description: 'ID of the post', example: 1 })
  async votePost(
    @GetUser('id') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateVoteDto,
  ): Promise<{ total_vote: number; userVote: number }> {
    return this.voteService.votePost(userId, postId, dto);
  }

  @Post('comments/:commentId')
  @ApiOperation({ summary: 'Vote on a comment' })
  @ApiParam({ name: 'commentId', required: true, description: 'ID of the comment', example: 1 })
  async voteComment(
    @GetUser('id') userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CreateVoteDto,
  ): Promise<{ score: number; userVote: number }> {
    return this.voteService.voteComment(userId, commentId, dto);
  }
}
