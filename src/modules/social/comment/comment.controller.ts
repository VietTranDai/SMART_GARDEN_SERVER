import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentDto, mapToCommentDto } from './dto/comment.dto';

@ApiTags('Comments')
@Controller('community/comments')
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiQuery({ name: 'postId', required: true, description: 'Post ID' })
  async getPostComments(
    @Query('postId', ParseIntPipe) postId: number,
  ): Promise<CommentDto[]> {
    const comments = await this.commentService.getPostComments(postId);
    return comments.map(mapToCommentDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment or reply' })
  async createComment(
    @GetUser('id') gardenerId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentDto> {
    const comment = await this.commentService.createComment(
      gardenerId,
      dto.postId,
      dto.content,
      dto.parentId,
    );
    return mapToCommentDto(comment);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment details by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async getCommentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommentDto> {
    const comment = await this.commentService.getCommentById(id);
    return mapToCommentDto(comment);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get replies for a comment' })
  @ApiParam({ name: 'id', description: 'Parent comment ID' })
  async getReplies(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommentDto[]> {
    const replies = await this.commentService.getCommentReplies(id);
    return replies.map(mapToCommentDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async updateComment(
    @GetUser('id') gardenerId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
  ): Promise<CommentDto> {
    const updated = await this.commentService.updateComment(
      gardenerId,
      id,
      content,
    );
    return mapToCommentDto(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @HttpCode(204)
  async deleteComment(
    @GetUser('id') gardenerId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.commentService.deleteComment(gardenerId, id);
  }
}
