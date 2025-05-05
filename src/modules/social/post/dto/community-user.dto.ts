import { ApiProperty } from '@nestjs/swagger';
import { User, Gardener, ExperienceLevel } from '@prisma/client';

export class CommunityUserDto {
  @ApiProperty({ description: 'ID người dùng', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên đầy đủ', example: 'Nguyễn Văn A' })
  fullName: string;

  @ApiProperty({ description: 'Tên người dùng (username)', example: 'nguyenvana' })
  username: string;

  @ApiProperty({ description: 'Ảnh đại diện người dùng', example: 'https://example.com/avatar.jpg', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'Tiểu sử cá nhân', example: 'Yêu làm vườn và chia sẻ kiến thức' })
  bio?: string;

  @ApiProperty({ description: 'Cấp độ hiện tại', example: 'Người làm vườn mới', required: false })
  levelTitle?: string;

  @ApiProperty({ description: 'Biểu tượng cấp độ', example: '🌱', required: false })
  levelIcon?: string;
}

export function mapToCommunityUserDto(
  user: User & {
    gardener?: Gardener & {
      experienceLevel?: ExperienceLevel;
    };
  },
): CommunityUserDto {
  return {
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    username: user.username,
    profilePicture: user.profilePicture || undefined,
    bio: user.bio || undefined,
    levelTitle: user.gardener?.experienceLevel?.title,
    levelIcon: user.gardener?.experienceLevel?.icon,
  };
}
