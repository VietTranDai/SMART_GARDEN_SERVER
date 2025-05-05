import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityUserDto, mapToCommunityUserDto } from '../../post/dto/community-user.dto';

export class CommentDto {
  @ApiProperty({ example: 101, description: 'ID của bình luận' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID bài viết liên quan' })
  postId: number;

  @ApiPropertyOptional({ example: 55, description: 'ID của bình luận cha nếu là phản hồi' })
  parentId?: number;

  @ApiProperty({ example: 10, description: 'ID người làm vườn đã viết bình luận' })
  gardenerId: number;

  @ApiProperty({ description: 'Thông tin người bình luận' })
  userdata: CommunityUserDto;

  @ApiProperty({ example: 'Cây của bạn phát triển tốt quá!', description: 'Nội dung bình luận' })
  content: string;

  @ApiProperty({ example: 12, description: 'Tổng điểm vote của bình luận' })
  score: number;

  @ApiProperty({ description: 'Thời điểm tạo bình luận' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời điểm cập nhật bình luận' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [CommentDto], description: 'Danh sách phản hồi cho bình luận này' })
  replies?: CommentDto[];

  @ApiPropertyOptional({ example: 1, description: 'Vote hiện tại của người dùng: 1 (up), -1 (down), 0 (chưa vote)' })
  userVote?: number;
}

export function mapToCommentDto(comment: any): CommentDto {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId ?? undefined,
    gardenerId: comment.gardenerId,
    userdata: mapToCommunityUserDto(comment.gardener?.user),
    content: comment.content,
    score: comment.score,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replies: comment.replies?.map(mapToCommentDto),
    userVote: comment.userVote ?? 0,
  };
}
