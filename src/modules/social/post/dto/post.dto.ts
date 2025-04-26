import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentDto } from '../../comment/dto/comment.dto';
import { TagDto } from '../../tag/dto/tag.dto';
import { PostImageDto } from '../../post_image/dto/post-image.dto';

export class PostDto {
  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  id: number;

  @ApiProperty({
    description: 'ID của người làm vườn tạo bài viết',
    example: 1,
  })
  gardenerId: number;

  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Cách trồng cà chua trong chậu',
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Bài viết hướng dẫn chi tiết cách trồng cà chua...',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'ID của khu vườn liên quan (nếu có)',
    example: 1,
  })
  gardenId?: number;

  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  plantName?: string;

  @ApiPropertyOptional({
    description: 'Giai đoạn phát triển của cây',
    example: 'Seedling',
  })
  plantGrowStage?: string;

  @ApiProperty({ description: 'Tổng số lượt vote', example: 10 })
  total_vote: number;

  @ApiProperty({ description: 'Thời gian tạo bài viết' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật bài viết' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Danh sách bình luận',
    type: [CommentDto],
  })
  comments?: CommentDto[];

  @ApiPropertyOptional({ description: 'Danh sách thẻ', type: [TagDto] })
  tags?: TagDto[];

  @ApiPropertyOptional({
    description: 'Danh sách hình ảnh',
    type: [PostImageDto],
  })
  images?: PostImageDto[];

  @ApiPropertyOptional({
    description: 'Trạng thái vote của người dùng hiện tại',
    example: 1,
  })
  userVote?: number;
}

export class PostPaginationDto {
  @ApiProperty({ description: 'Danh sách bài viết', type: [PostDto] })
  items: PostDto[];

  @ApiProperty({ description: 'Tổng số bài viết', example: 100 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page: number;

  @ApiProperty({ description: 'Số lượng bài viết trên một trang', example: 10 })
  limit: number;
}
