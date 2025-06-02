import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentDto, mapToCommentDto } from '../../comment/dto/comment.dto';
import { mapToTagDto, TagDto } from '../../tag/dto/tag.dto';
import { Post, PostImage, Tag, Comment, User, ExperienceLevel, Gardener } from '@prisma/client';
import { CommunityUserDto, mapToCommunityUserDto } from './community-user.dto';

export class PostImageDto {
  @ApiProperty({ description: 'ID của hình ảnh', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  postId: number;

  @ApiProperty({ description: 'URL của hình ảnh', example: 'https://example.com/images/tomato.jpg' })
  url: string;
}

export class PostDto {
  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của người làm vườn tạo bài viết', example: 1 })
  gardenerId: number;

  @ApiProperty({ description: 'Thông tin người dùng tạo bài viết', type: CommunityUserDto })
  userdata: CommunityUserDto;

  @ApiProperty({ description: 'Tiêu đề bài viết', example: 'Cách trồng cà chua trong chậu' })
  title: string;

  @ApiProperty({ description: 'Nội dung bài viết', example: 'Bài viết hướng dẫn chi tiết cách trồng cà chua...' })
  content: string;

  @ApiPropertyOptional({ description: 'ID của khu vườn liên quan (nếu có)', example: 1 })
  gardenId?: number;

  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  plantName?: string;

  @ApiPropertyOptional({ description: 'Giai đoạn phát triển của cây', example: 'Seedling' })
  plantGrowStage?: string;

  @ApiProperty({ description: 'Tổng số lượt vote', example: 10 })
  total_vote: number;

  @ApiProperty({ description: 'Thời gian tạo bài viết' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật bài viết' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Danh sách bình luận', type: [CommentDto] })
  comments?: CommentDto[];

  @ApiPropertyOptional({ description: 'Số lượng bình luận', example: 5 })
  commentCount?: number;

  @ApiPropertyOptional({ description: 'Danh sách thẻ', type: [TagDto] })
  tags?: TagDto[];

  @ApiPropertyOptional({ description: 'Danh sách hình ảnh', type: [PostImageDto] })
  images?: PostImageDto[];

  @ApiPropertyOptional({ description: 'Số lượng hình ảnh', example: 3 })
  imageCount?: number;

  @ApiPropertyOptional({ description: 'Trạng thái vote của người dùng hiện tại', example: 1 })
  userVote?: number;
}

// Updated mapToPostDto to accept separate parts and a User with optional experienceLevel
export function mapToPostDto(
  post: Post & {
    gardenerId: number;
    gardenId?: number | null;
    plantName?: string | null;
    plantGrowStage?: string | null;
    total_vote: number;
  },
  tags: Tag[],
  images: PostImage[],
  comments: Comment[],
  user: any,
  userVote?: number,
): PostDto {
  return {
    id: post.id,
    gardenerId: post.gardenerId,
    userdata: mapToCommunityUserDto(user),
    title: post.title,
    content: post.content,
    gardenId: post.gardenId ?? undefined,
    plantName: post.plantName ?? undefined,
    plantGrowStage: post.plantGrowStage ?? undefined,
    total_vote: post.total_vote,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    tags: tags.map(t => mapToTagDto(t)),
    comments: comments.map(c => mapToCommentDto(c)),
    images: images.map(img => ({ id: img.id, postId: img.postId, url: img.url })),
    userVote: userVote ?? undefined,
  };
}
