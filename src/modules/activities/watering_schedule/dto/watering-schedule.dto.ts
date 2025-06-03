import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WateringSchedule } from '@prisma/client';
import { IsDateString, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class WateringScheduleDto {
  @ApiProperty({ description: 'ID lịch tưới', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID vườn', example: 10 })
  gardenId: number;

  @ApiProperty({ description: 'Thời gian tưới theo lịch', type: String, format: 'date-time' })
  scheduledAt: Date;

  @ApiPropertyOptional({ description: 'Lượng nước tưới (lít)', example: 5.0 })
  amount?: number;

  @ApiPropertyOptional({ description: 'Lý do tưới nước', example: 'Tưới nước cho cây trồng' })
  reason?: string;

  @ApiProperty({ description: 'Trạng thái lịch tưới', example: 'PENDING' })
  status: string;

  @ApiPropertyOptional({ description: 'Ghi chú bổ sung', example: 'Tưới nhiều hơn nếu trời nắng' })
  notes?: string;

  @ApiProperty({ description: 'Thời gian tạo', type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật', type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CreateWateringScheduleDto {
  @ApiProperty({ 
    description: 'Thời gian tưới theo lịch', 
    type: String, 
    format: 'date-time',
    example: '2025-06-03T10:25:00.000Z'
  })
  @IsDateString({}, { message: 'scheduledAt phải là định dạng ngày tháng hợp lệ (ISO 8601)' })
  scheduledAt: string | Date;

  @ApiPropertyOptional({ 
    description: 'Lượng nước tưới (lít)', 
    example: 5.0,
    minimum: 0.1,
    maximum: 20.0
  })
  @IsOptional()
  @IsNumber({}, { message: 'amount phải là số' })
  @Min(0.1, { message: 'Lượng nước phải ít nhất 0.1 lít' })
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ 
    description: 'Ghi chú bổ sung', 
    example: 'Tưới trước khi trời mưa',
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'notes phải là chuỗi văn bản' })
  notes?: string;
}

export class UpdateWateringScheduleDto {
  @ApiPropertyOptional({ description: 'Thời gian tưới mới', type: String, format: 'date-time' })
  scheduledAt?: Date;

  @ApiPropertyOptional({ description: 'Lượng nước tưới mới (lít)', example: 6.0 })
  amount?: number;

  @ApiPropertyOptional({ description: 'Trạng thái lịch tưới', example: 'COMPLETED' })
  status?: string;

  @ApiPropertyOptional({ description: 'Ghi chú mới', example: 'Đã tưới xong sớm hơn dự kiến' })
  notes?: string;
}

export function mapToWateringScheduleDto(model: WateringSchedule): WateringScheduleDto {
  return {
    id: model.id,
    gardenId: model.gardenId,
    scheduledAt: model.scheduledAt,
    amount: model.amount ?? undefined,
    status: model.status,
    notes: model.notes ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    reason: model.reason ?? undefined,
  };
}

export function mapToWateringScheduleDtoList(models: WateringSchedule[]): WateringScheduleDto[] {
  return models.map(mapToWateringScheduleDto);
}
