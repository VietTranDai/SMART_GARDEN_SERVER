import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetGardenActivitiesQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo ID khu vườn',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'Garden ID phải là một số nguyên.' })
  @Min(1, { message: 'Garden ID phải lớn hơn hoặc bằng 1.' })
  gardenId?: number;

  @ApiPropertyOptional({
    description: 'Lọc theo loại hoạt động',
    enum: ActivityType,
  })
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Loại hoạt động không hợp lệ.' })
  type?: ActivityType;

  @ApiPropertyOptional({
    description: 'Lọc hoạt động từ ngày (ISO 8601 string)',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ngày bắt đầu phải là một chuỗi ngày tháng hợp lệ (ISO 8601).' },
  )
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Lọc hoạt động đến ngày (ISO 8601 string)',
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Ngày kết thúc phải là một chuỗi ngày tháng hợp lệ (ISO 8601).',
    },
  )
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Số trang (mặc định là 1)',
    type: Number,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt({ message: 'Số trang phải là số nguyên.' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1.' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Số lượng mục trên mỗi trang (mặc định là 10)',
    type: Number,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  @IsInt({ message: 'Số lượng mục phải là số nguyên.' })
  @Min(1, { message: 'Số lượng mục tối thiểu là 1.' })
  @Max(100, { message: 'Số lượng mục tối đa là 100.' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Phân tích theo người dùng cụ thể (ID)',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'User ID phân tích phải là số nguyên.' })
  analyzeByUserId?: number;

  @ApiPropertyOptional({
    description:
      'Khoảng thời gian phân tích (ví dụ: last7days, last30days, customRange)',
    type: String,
  })
  @IsOptional()
  @IsString()
  analysisPeriod?: string;

  @ApiPropertyOptional({
    description: 'Trường để sắp xếp (ví dụ: timestamp, name, activityType)',
    type: String,
    example: 'timestamp',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp (asc hoặc desc)',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Thứ tự sắp xếp phải là "asc" hoặc "desc".',
  })
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Số mục bỏ qua (dùng cho phân trang offset)',
    type: Number,
    minimum: 0,
    example: 0,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 0))
  @IsInt({ message: 'Số mục bỏ qua phải là số nguyên.' })
  @Min(0, { message: 'Số mục bỏ qua phải lớn hơn hoặc bằng 0.' })
  offset?: number;
}
