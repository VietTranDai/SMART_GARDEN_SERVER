import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType } from '@prisma/client';

/**
 * DTO để lọc và truy vấn thống kê hoạt động
 */
export class ActivityStatsQueryDto {
  @ApiPropertyOptional({
    description:
      'ID của khu vườn cần thống kê (bỏ trống để thống kê tất cả khu vườn)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'ID khu vườn phải là số nguyên' })
  @Min(1, { message: 'ID khu vườn phải lớn hơn 0' })
  @Type(() => Number)
  gardenId?: number;

  @ApiProperty({
    description: 'Ngày bắt đầu thống kê (định dạng ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  @IsDateString({}, { message: 'Ngày bắt đầu phải có định dạng hợp lệ' })
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc thống kê (định dạng ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
    type: String,
  })
  @IsDateString({}, { message: 'Ngày kết thúc phải có định dạng hợp lệ' })
  endDate: string;

  @ApiPropertyOptional({
    description: 'Loại hoạt động cần lọc',
    enum: ActivityType,
    example: ActivityType.WATERING,
  })
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Loại hoạt động không hợp lệ' })
  activityType?: ActivityType;
}

/**
 * Thống kê theo loại hoạt động
 */
export class ActivityTypeStatsDto {
  @ApiProperty({
    description: 'Loại hoạt động',
    enum: ActivityType,
    example: ActivityType.WATERING,
  })
  type: ActivityType;

  @ApiProperty({
    description: 'Tên hiển thị của loại hoạt động',
    example: 'Tưới nước',
  })
  displayName: string;

  @ApiProperty({
    description: 'Số lượng hoạt động đã thực hiện',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'Phần trăm so với tổng số hoạt động',
    example: 45.5,
  })
  percentage: number;
}

/**
 * Thống kê theo ngày
 */
export class DailyActivityStatsDto {
  @ApiProperty({
    description: 'Ngày thực hiện hoạt động',
    example: '2024-05-28',
  })
  date: string;

  @ApiProperty({
    description: 'Số lượng hoạt động trong ngày',
    example: 5,
  })
  activityCount: number;

  @ApiProperty({
    description: 'Chi tiết số lượng theo từng loại hoạt động',
    type: [ActivityTypeStatsDto],
  })
  activityBreakdown: ActivityTypeStatsDto[];
}

/**
 * Thống kê theo tháng
 */
export class MonthlyActivityStatsDto {
  @ApiProperty({
    description: 'Tháng (định dạng YYYY-MM)',
    example: '2024-05',
  })
  month: string;

  @ApiProperty({
    description: 'Số lượng hoạt động trong tháng',
    example: 150,
  })
  activityCount: number;

  @ApiProperty({
    description: 'Số ngày có hoạt động trong tháng',
    example: 28,
  })
  activeDays: number;

  @ApiProperty({
    description: 'Trung bình hoạt động mỗi ngày',
    example: 5.4,
  })
  averagePerDay: number;
}

/**
 * Thống kê theo khu vườn
 */
export class GardenActivityStatsDto {
  @ApiProperty({
    description: 'ID của khu vườn',
    example: 1,
  })
  gardenId: number;

  @ApiProperty({
    description: 'Tên khu vườn',
    example: 'Vườn rau sân thượng',
  })
  gardenName: string;

  @ApiProperty({
    description: 'Loại khu vườn',
    example: 'ROOFTOP',
  })
  gardenType: string;

  @ApiProperty({
    description: 'Tổng số hoạt động',
    example: 89,
  })
  totalActivities: number;

  @ApiProperty({
    description: 'Hoạt động thực hiện gần nhất',
    example: '2024-05-28T08:15:00.000Z',
    required: false,
  })
  lastActivity?: string;

  @ApiProperty({
    description: 'Chi tiết hoạt động theo loại',
    type: [ActivityTypeStatsDto],
  })
  activityBreakdown: ActivityTypeStatsDto[];
}

/**
 * Xu hướng hoạt động theo thời gian
 */
export class ActivityTrendDto {
  @ApiProperty({
    description: 'Khoảng thời gian (ngày/tuần/tháng)',
    example: 'week',
  })
  period: string;

  @ApiProperty({
    description: 'Nhãn thời gian',
    example: 'Tuần 21/2024',
  })
  label: string;

  @ApiProperty({
    description: 'Số lượng hoạt động',
    example: 35,
  })
  count: number;

  @ApiProperty({
    description: 'Thay đổi so với kỳ trước (%)',
    example: 15.5,
  })
  changePercent: number;
}

/**
 * Thống kê tổng quan hoạt động
 */
export class ActivityOverviewStatsDto {
  @ApiProperty({
    description: 'Tổng số hoạt động trong khoảng thời gian',
    example: 324,
  })
  totalActivities: number;

  @ApiProperty({
    description: 'Trung bình hoạt động mỗi ngày',
    example: 2.8,
  })
  averagePerDay: number;

  @ApiProperty({
    description: 'Số ngày có hoạt động',
    example: 115,
  })
  activeDays: number;

  @ApiProperty({
    description: 'Tổng số ngày trong khoảng thời gian',
    example: 120,
  })
  totalDays: number;

  @ApiProperty({
    description: 'Tỷ lệ ngày có hoạt động (%)',
    example: 95.8,
  })
  activityRate: number;

  @ApiProperty({
    description: 'Loại hoạt động phổ biến nhất',
    example: 'WATERING',
  })
  mostCommonActivity: ActivityType;

  @ApiProperty({
    description: 'Tên hiển thị hoạt động phổ biến nhất',
    example: 'Tưới nước',
  })
  mostCommonActivityName: string;

  @ApiProperty({
    description: 'Khu vườn có nhiều hoạt động nhất',
    example: 'Vườn rau sân thượng',
    required: false,
  })
  mostActiveGarden?: string;
}

/**
 * Response DTO cho thống kê hoạt động chi tiết
 */
export class ActivityStatsResponseDto {
  @ApiProperty({
    description: 'Thông tin tổng quan',
    type: ActivityOverviewStatsDto,
  })
  overview: ActivityOverviewStatsDto;

  @ApiProperty({
    description: 'Thống kê theo loại hoạt động',
    type: [ActivityTypeStatsDto],
  })
  byActivityType: ActivityTypeStatsDto[];

  @ApiProperty({
    description: 'Thống kê theo ngày',
    type: [DailyActivityStatsDto],
  })
  dailyStats: DailyActivityStatsDto[];

  @ApiProperty({
    description: 'Thống kê theo tháng',
    type: [MonthlyActivityStatsDto],
  })
  monthlyStats: MonthlyActivityStatsDto[];

  @ApiProperty({
    description: 'Thống kê theo khu vườn (nếu không chỉ định gardenId)',
    type: [GardenActivityStatsDto],
    required: false,
  })
  byGarden?: GardenActivityStatsDto[];

  @ApiProperty({
    description: 'Xu hướng hoạt động theo thời gian',
    type: [ActivityTrendDto],
  })
  trends: ActivityTrendDto[];

  @ApiProperty({
    description: 'Thời gian tạo báo cáo',
    example: '2024-05-28T08:20:59.000Z',
  })
  generatedAt: string;

  @ApiProperty({
    description: 'Khoảng thời gian được thống kê',
    example: {
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-05-28T23:59:59.999Z',
    },
  })
  period: {
    startDate: string;
    endDate: string;
  };
}