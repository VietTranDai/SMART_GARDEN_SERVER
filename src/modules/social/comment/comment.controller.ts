import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommentDto, CommentPaginationDto } from './dto/comment.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

interface JwtPayload {
  sub: number;
  email: string;
}

@ApiTags('Comments')
@Controller('comments')
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @ApiResponse({
    status: 201,
    description: 'Bình luận đã được tạo thành công.',
    type: CommentDto,
  })
  create(
    @GetUser() user: JwtPayload,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    return this.commentService.create(user.sub, createCommentDto);
  }

  @Get('post/:postId')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách bình luận của một bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bình luận.',
    type: CommentPaginationDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng bình luận trên một trang',
  })
  findAllByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @GetUser() user?: JwtPayload,
  ): Promise<CommentPaginationDto> {
    return this.commentService.findAllByPost(postId, page, limit, user?.sub);
  }

  @Get(':commentId/replies')
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách trả lời cho một bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách trả lời.',
    type: CommentPaginationDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng trả lời trên một trang',
  })
  findReplies(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @GetUser() user?: JwtPayload,
  ): Promise<CommentPaginationDto> {
    return this.commentService.findReplies(commentId, page, limit, user?.sub);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết của bình luận.',
    type: CommentDto,
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user?: JwtPayload,
  ): Promise<CommentDto> {
    return this.commentService.findOne(id, user?.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Bình luận đã được cập nhật thành công.',
    type: CommentDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    return this.commentService.update(id, user.sub, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiResponse({
    status: 204,
    description: 'Bình luận đã được xóa thành công.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ): Promise<void> {
    return this.commentService.remove(id, user.sub);
  }
}
