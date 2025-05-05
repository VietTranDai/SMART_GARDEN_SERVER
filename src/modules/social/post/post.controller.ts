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
  UploadedFiles,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PostDto, mapToPostDto } from './dto/post.dto';
import { PostService } from './post.service';

@ApiTags('Post')
@Controller('posts')
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  // @Get()
  // @ApiOperation({ summary: 'Get all posts with optional filters' })
  // @ApiQuery({ name: 'tag', required: false })
  // @ApiQuery({ name: 'search', required: false })
  // @ApiQuery({ name: 'gardenerId', required: false })
  // @ApiQuery({ name: 'plantName', required: false })
  // @ApiQuery({ name: 'page', required: false })
  // @ApiQuery({ name: 'limit', required: false })
  // async getPosts(@Query() query: any): Promise<PostDto[]> {
  //   const result = await this.postService.getPosts(query);
  //   return result.map(mapToPostDto);
  // }
  //
  // @Get(':id')
  // @ApiOperation({ summary: 'Get post details by ID' })
  // @ApiParam({ name: 'id' })
  // async getPostById(@Param('id', ParseIntPipe) id: number): Promise<PostDto> {
  //   const result = await this.postService.getPostById(id);
  //   return mapToPostDto(result);
  // }
  //
  // @Post()
  // @ApiOperation({ summary: 'Create a new post' })
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
  // async createPost(
  //   @GetUser('id') userId: number,
  //   @Body() body: any,
  //   @UploadedFiles() files: { images?: Express.Multer.File[] },
  // ): Promise<PostDto> {
  //   const result = await this.postService.createPost(userId, body, files?.images || []);
  //   return mapToPostDto(result);
  // }
  //
  // @Patch(':id')
  // @ApiOperation({ summary: 'Update a post' })
  // async updatePost(
  //   @GetUser('id') userId: number,
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() body: Partial<CreatePostDto>,
  // ): Promise<PostDto> {
  //   const result = await this.postService.updatePost(userId, id, body);
  //   return mapToPostDto(result);
  // }
  //
  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a post' })
  // @HttpCode(204)
  // async deletePost(
  //   @GetUser('id') userId: number,
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<void> {
  //   return this.postService.deletePost(userId, id);
  // }
  //
  // @Get(':id/comments')
  // @ApiOperation({ summary: 'Get comments of a post' })
  // @ApiParam({ name: 'id' })
  // async getComments(@Param('id', ParseIntPipe) id: number) {
  //   return this.postService.getCommentsByPostId(id);
  // }
}
