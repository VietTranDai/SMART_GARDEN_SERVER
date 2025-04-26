import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostImageService } from './post-image.service';
import { CreatePostImageDto } from './dto/create-post-image.dto';
import { PostImageDto } from './dto/post-image.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';

interface JwtPayload {
  sub: number;
  email: string;
}

@ApiTags('Post Images')
@Controller('post-images')
@ApiBearerAuth()
export class PostImageController {
  constructor(private readonly postImageService: PostImageService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm hình ảnh cho bài viết' })
  @ApiResponse({
    status: 201,
    description: 'Hình ảnh đã được thêm thành công.',
    type: PostImageDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết.' })
  create(
    @GetUser() user: JwtPayload,
    @Body() createPostImageDto: CreatePostImageDto,
  ): Promise<PostImageDto> {
    return this.postImageService.create(user.sub, createPostImageDto);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Lấy danh sách hình ảnh của một bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách hình ảnh của bài viết.',
    type: [PostImageDto],
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết.' })
  findByPostId(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<PostImageDto[]> {
    return this.postImageService.findByPostId(postId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một hình ảnh' })
  @ApiResponse({
    status: 200,
    description: 'Hình ảnh đã được xóa thành công.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hình ảnh.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ): Promise<void> {
    return this.postImageService.remove(id, user.sub);
  }
}
