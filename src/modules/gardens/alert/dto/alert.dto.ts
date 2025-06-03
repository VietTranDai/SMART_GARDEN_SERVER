// src/modules/alerts/dto/alert.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Alert, AlertStatus, Severity, AlertType } from '@prisma/client';

export class AlertDto {
  @ApiProperty({ description: 'ID của alert', example: 1 })
  id: number;

  @ApiPropertyOptional({ description: 'ID của garden (nếu có)', example: 10 })
  gardenId?: number;

  @ApiPropertyOptional({ description: 'Tên của garden', example: 'Vườn Rau Nhà Tôi' })
  gardenName?: string;

  @ApiProperty({ description: 'ID của user tạo alert', example: 5 })
  userId: number;

  @ApiProperty({ description: 'Loại alert', enum: AlertType })
  type: AlertType;

  @ApiProperty({ description: 'Nội dung thông báo', example: 'Nhiệt độ quá cao trong vườn' })
  message: string;

  @ApiPropertyOptional({ description: 'Gợi ý xử lý', example: 'Bật quạt làm mát và tưới nước cho cây' })
  suggestion?: string;

  @ApiProperty({ description: 'Trạng thái của alert', enum: AlertStatus })
  status: AlertStatus;

  @ApiProperty({ description: 'Mức độ ưu tiên', enum: Severity })
  severity: Severity;

  @ApiProperty({ description: 'Thời gian tạo', type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật', type: String, format: 'date-time' })
  updatedAt: Date;
}

export function mapToAlertDto(alert: Alert & { garden?: { name: string } | null }): AlertDto {
  return {
    id: alert.id,
    gardenId: alert.gardenId ?? undefined,
    gardenName: alert.garden?.name ?? undefined,
    userId: alert.userId,
    type: alert.type,
    message: alert.message,
    suggestion: alert.suggestion ?? undefined,
    status: alert.status,
    severity: alert.severity,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}

export function mapToAlertDtoList(alerts: (Alert & { garden?: { name: string } | null })[]): AlertDto[] {
  return alerts.map(mapToAlertDto);
}
