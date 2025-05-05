import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentDto, mapToCommentDto } from '../../comment/dto/comment.dto';
import { mapToTagDto, TagDto } from '../../tag/dto/tag.dto';
import { Post, PostImage, Tag, Comment, Gardener, User, ExperienceLevel } from '@prisma/client';
import { CommunityUserDto, mapToCommunityUserDto } from './community-user.dto';

export class PostImageDto {
  @ApiProperty({ description: 'ID của hình ảnh', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  postId: number;

  @ApiProperty({
    description: 'URL của hình ảnh',
    example: 'https://example.com/images/tomato.jpg',
  })
  url: string;
}

export class PostDto {
  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  id: number;

  @ApiProperty({
    description: 'ID của người làm vườn tạo bài viết',
    example: 1,
  })
  gardenerId: number;

  @ApiProperty({
    description: 'Thông tin người dùng tạo bài viết',
    type: CommunityUserDto,
  })
  userdata: CommunityUserDto;

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

export function mapToPostImageDto(image: PostImage): PostImageDto {
  return {
    id: image.id,
    postId: image.postId,
    url: image.url,
  };
}

export function mapToPostDto(
  post: Post & {
    tags?: { tag: Tag }[];
    images?: PostImage[];
    comments?: Comment[];
    gardener: Gardener & {
      user: User & {
        gardener?: Gardener & { experienceLevel?: ExperienceLevel };
      };
    };
    userVote?: number;
  },
): PostDto {
  return {
    id: post.id,
    gardenerId: post.gardenerId,
    userdata: mapToCommunityUserDto(post.gardener.user),
    gardenId: post.gardenId ?? undefined,
    plantName: post.plantName ?? undefined,
    plantGrowStage: post.plantGrowStage ?? undefined,
    title: post.title,
    content: post.content,
    total_vote: post.total_vote,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    tags: post.tags?.map((t) => mapToTagDto(t.tag)) ?? [],
    comments: post.comments?.map(mapToCommentDto) ?? [],
    images: post.images?.map(mapToPostImageDto) ?? [],
    userVote: post.userVote ?? undefined,
  };
}
