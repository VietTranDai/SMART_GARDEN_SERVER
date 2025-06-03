// src/modules/social/post/post.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  Query,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDto } from './dto/post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { mapToCommentDto } from '../comment/dto/comment.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('community/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @ApiOperation({
    summary: 'Search and filter posts',
    description: 'Returns posts matching the search criteria with advanced filtering and pagination',
  })
  @ApiOkResponse({
    description: 'Filtered posts with pagination info',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PostDto' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Invalid search parameters' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async searchPosts(@Query() searchDto: SearchPostDto): Promise<{
    data: PostDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      return await this.postService.searchPostsAdvanced(searchDto);
    } catch (error) {
      console.error('Error in searchPosts controller:', error);
      throw new InternalServerErrorException('Failed to search posts');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the post' })
  @ApiOkResponse({ type: PostDto, description: 'The requested post' })
  @ApiBadRequestResponse({ description: 'Invalid post ID' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getPostById(@Param('id', ParseIntPipe) id: number): Promise<PostDto> {
    try {
      if (isNaN(id) || id < 1) {
        throw new BadRequestException('Invalid post ID');
      }
      return await this.postService.getPostById(id);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404) {
        throw error;
      }
      console.error('Error in getPostById controller:', error);
      throw new InternalServerErrorException('Failed to fetch post');
    }
  }

  @HttpPost()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiCreatedResponse({ type: PostDto, description: 'The created post' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async createPost(
    @GetUser('id') userId: number,
    @Body() body: CreatePostDto & { tagIds?: string[] },
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<PostDto> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      return await this.postService.createPost(userId, body, images);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in createPost controller:', error);
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing post' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the post to update',
  })
  @ApiOkResponse({ type: PostDto, description: 'The updated post' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updatePost(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CreatePostDto>,
  ): Promise<PostDto> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (isNaN(id) || id < 1) {
        throw new BadRequestException('Invalid post ID');
      }
      return await this.postService.updatePost(userId, id, data);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404 || error.status === 403) {
        throw error;
      }
      console.error('Error in updatePost controller:', error);
      throw new InternalServerErrorException('Failed to update post');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the post to delete',
  })
  @ApiNoContentResponse({ description: 'Post deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid post ID' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async deletePost(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (isNaN(id) || id < 1) {
        throw new BadRequestException('Invalid post ID');
      }
      await this.postService.deletePost(userId, id);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404 || error.status === 403) {
        throw error;
      }
      console.error('Error in deletePost controller:', error);
      throw new InternalServerErrorException('Failed to delete post');
    }
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a specific post' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the post' })
  @ApiOkResponse({ description: 'List of comments for the post' })
  @ApiBadRequestResponse({ description: 'Invalid post ID' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getCommentsByPostId(@Param('id', ParseIntPipe) postId: number) {
    try {
      if (isNaN(postId) || postId < 1) {
        throw new BadRequestException('Invalid post ID');
      }
      const comments = await this.postService.getCommentsByPostId(postId);
      return comments.map(mapToCommentDto);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404) {
        throw error;
      }
      console.error('Error in getCommentsByPostId controller:', error);
      throw new InternalServerErrorException('Failed to fetch comments');
    }
  }
}
