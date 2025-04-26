import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentReplyDto {
  @ApiProperty({ description: 'ID của bình luận', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của người làm vườn', example: 1 })
  gardenerId: number;

  @ApiProperty({ description: 'Tên người làm vườn', example: 'Nguyễn Văn A' })
  gardenerName: string;

  @ApiProperty({
    description: 'Nội dung bình luận',
    example: 'Bài viết rất hữu ích!',
  })
  content: string;

  @ApiProperty({ description: 'Số điểm của bình luận', example: 5 })
  score: number;

  @ApiProperty({ description: 'Thời gian tạo bình luận' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật bình luận' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Trạng thái vote của người dùng hiện tại',
    example: 1,
  })
  userVote?: number;
}

export class CommentDto extends CommentReplyDto {
  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  postId: number;

  @ApiPropertyOptional({ description: 'ID của bình luận cha', example: 5 })
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Danh sách các trả lời',
    type: [CommentReplyDto],
  })
  replies?: CommentReplyDto[];
}

export class CommentPaginationDto {
  @ApiProperty({ description: 'Danh sách bình luận', type: [CommentDto] })
  items: CommentDto[];

  @ApiProperty({ description: 'Tổng số bình luận', example: 100 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page: number;

  @ApiProperty({
    description: 'Số lượng bình luận trên một trang',
    example: 10,
  })
  limit: number;
}
