import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WateringSchedule } from '@prisma/client';

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
  @ApiProperty({ description: 'ID vườn', example: 10 })
  gardenId: number;

  @ApiProperty({ description: 'Thời gian tưới theo lịch', type: String, format: 'date-time' })
  scheduledAt: Date;

  @ApiPropertyOptional({ description: 'Lượng nước tưới (lít)', example: 5.0 })
  amount?: number;

  @ApiPropertyOptional({ description: 'Ghi chú bổ sung', example: 'Tưới trước khi trời mưa' })
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
