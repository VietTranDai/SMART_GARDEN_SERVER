import { Controller, Post, Body } from '@nestjs/common';
import { VoteService } from './vote.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteDto } from './dto/vote.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { JwtPayload } from '../../auth/dto/jwt-payload.interface';

@ApiTags('Votes')
@Controller('votes')
@ApiBearerAuth()
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post()
  @ApiOperation({ summary: 'Thực hiện bình chọn cho bài viết hoặc bình luận' })
  @ApiResponse({
    status: 201,
    description: 'Bình chọn đã được thực hiện thành công.',
    type: VoteDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy đối tượng bình chọn.',
  })
  vote(
    @GetUser() user: JwtPayload,
    @Body() createVoteDto: CreateVoteDto,
  ): Promise<VoteDto> {
    return this.voteService.vote(user.sub, createVoteDto);
  }
}
