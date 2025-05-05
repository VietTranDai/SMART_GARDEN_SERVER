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
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDto } from './dto/post.dto';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of posts', description: 'Returns a paginated list of posts with optional filters: tag, search, gardenerId, plantName' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag name' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by post title (case-insensitive)' })
  @ApiQuery({ name: 'gardenerId', required: false, description: 'Filter by gardener ID' })
  @ApiQuery({ name: 'plantName', required: false, description: 'Filter by plant name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiOkResponse({ type: [PostDto], description: 'List of posts' })
  async getPosts(@Query() query): Promise<PostDto[]> {
    return this.postService.getPosts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the post' })
  @ApiOkResponse({ type: PostDto, description: 'The requested post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostDto> {
    return this.postService.getPostById(id);
  }

  @HttpPost()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiCreatedResponse({ type: PostDto, description: 'The created post' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async createPost(
    @GetUser('id') userId: number,
    @Body() body: CreatePostDto & { tagIds?: string[] },
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<PostDto> {
    return this.postService.createPost(userId, body, images);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing post' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the post to update' })
  @ApiOkResponse({ type: PostDto, description: 'The updated post' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async updatePost(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CreatePostDto>,
  ): Promise<PostDto> {
    return this.postService.updatePost(userId, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the post to delete' })
  @ApiNoContentResponse({ description: 'Post deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async deletePost(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.postService.deletePost(userId, id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a specific post' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the post' })
  @ApiOkResponse({ description: 'List of comments for the post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async getCommentsByPostId(
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postService.getCommentsByPostId(postId);
  }
}
