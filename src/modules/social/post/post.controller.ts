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
  SetMetadata,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostDto, PostPaginationDto } from './dto/post.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtPayload } from 'src/modules/auth/dto/jwt-payload.interface';

@ApiTags('Posts')
@Controller('posts')
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({
    status: 201,
    description: 'Bài viết đã được tạo thành công.',
    type: PostDto,
  })
  create(
    @GetUser() user: JwtPayload,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    return this.postService.create(user.sub, createPostDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy danh sách bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bài viết.',
    type: PostPaginationDto,
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
    description: 'Số lượng bài viết trên một trang',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'total_vote'],
    description: 'Sắp xếp theo',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Thứ tự sắp xếp',
  })
  @ApiQuery({
    name: 'gardenerId',
    required: false,
    type: Number,
    description: 'ID của người làm vườn',
  })
  @ApiQuery({
    name: 'gardenId',
    required: false,
    type: Number,
    description: 'ID của khu vườn',
  })
  @ApiQuery({
    name: 'tagId',
    required: false,
    type: Number,
    description: 'ID của thẻ',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Từ khóa tìm kiếm',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy: 'createdAt' | 'total_vote' = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('gardenerId', ParseIntPipe) gardenerId?: number,
    @Query('gardenId', ParseIntPipe) gardenId?: number,
    @Query('tagId', ParseIntPipe) tagId?: number,
    @Query('search') search?: string,
    @GetUser() user?: JwtPayload,
  ): Promise<PostPaginationDto> {
    return this.postService.findAll(
      page,
      limit,
      sortBy,
      order,
      gardenerId,
      gardenId,
      tagId,
      search,
      user?.sub,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết của bài viết.',
    type: PostDto,
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user?: JwtPayload,
  ): Promise<PostDto> {
    return this.postService.findOne(id, user?.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Bài viết đã được cập nhật thành công.',
    type: PostDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    return this.postService.update(id, user.sub, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiResponse({
    status: 204,
    description: 'Bài viết đã được xóa thành công.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ): Promise<void> {
    return this.postService.remove(id, user.sub);
  }
}
