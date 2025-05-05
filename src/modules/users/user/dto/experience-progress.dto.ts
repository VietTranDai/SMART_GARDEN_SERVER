import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExperienceLevelDto } from '../../experience_level';

export class RecentActivityDto {
  @ApiProperty({ description: 'ID của hoạt động', example: 123 })
  id: number;

  @ApiProperty({ description: 'Tên hoạt động', example: 'Watering' })
  name: string;

  @ApiProperty({ description: 'Thời gian hoạt động', example: '2025-05-05T08:30:00Z' })
  timestamp: string;

  @ApiProperty({ description: 'Điểm nhận được cho hoạt động này', example: 10 })
  points: number;
}

export class ExperienceProgressDto {
  @ApiProperty({ description: 'Số điểm hiện tại của người dùng', example: 150 })
  currentPoints: number;

  @ApiProperty({ type: ExperienceLevelDto, description: 'Cấp độ hiện tại' })
  currentLevel: ExperienceLevelDto;

  @ApiPropertyOptional({ type: ExperienceLevelDto, description: 'Cấp độ kế tiếp (nếu có)' })
  nextLevel?: ExperienceLevelDto;

  @ApiPropertyOptional({ description: 'Điểm cần thêm để lên cấp kế tiếp', example: 50 })
  pointsToNextLevel?: number;

  @ApiProperty({ description: '% tiến độ lên cấp kế tiếp (0–100)', example: 75 })
  percentToNextLevel: number;

  @ApiProperty({ type: [RecentActivityDto], description: 'Danh sách các hoạt động gần nhất' })
  recentActivities: RecentActivityDto[];
}

