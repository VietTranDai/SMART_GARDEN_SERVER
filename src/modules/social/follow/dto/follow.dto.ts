import { ApiProperty } from '@nestjs/swagger';

export class FollowDto {
  @ApiProperty({ description: 'ID của người theo dõi', example: 1 })
  followerId: number;

  @ApiProperty({ description: 'ID của người được theo dõi', example: 2 })
  followedId: number;

  @ApiProperty({ description: 'Thời gian bắt đầu theo dõi' })
  createdAt: Date;
}

export class GardenerDto {
  @ApiProperty({ description: 'ID của người làm vườn', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên người dùng', example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl?: string;
}

export class FollowerListDto {
  @ApiProperty({ description: 'Danh sách người theo dõi', type: [GardenerDto] })
  followers: GardenerDto[];

  @ApiProperty({ description: 'Tổng số người theo dõi', example: 42 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page: number;

  @ApiProperty({
    description: 'Số lượng người theo dõi trên một trang',
    example: 10,
  })
  limit: number;
}

export class FollowingListDto {
  @ApiProperty({
    description: 'Danh sách người đang theo dõi',
    type: [GardenerDto],
  })
  following: GardenerDto[];

  @ApiProperty({ description: 'Tổng số người đang theo dõi', example: 35 })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  page: number;

  @ApiProperty({
    description: 'Số lượng người đang theo dõi trên một trang',
    example: 10,
  })
  limit: number;
}
