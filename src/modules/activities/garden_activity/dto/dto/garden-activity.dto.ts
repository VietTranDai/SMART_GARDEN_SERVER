import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, EvaluatorType, GardenActivity, ActivityEvaluation } from '@prisma/client';

export class GardenActivityDto {
  @ApiProperty({ description: 'ID hoạt động', example: 10 })
  id: number;

  @ApiProperty({ description: 'ID vườn', example: 1 })
  gardenId: number;

  @ApiProperty({ description: 'ID gardener', example: 5 })
  gardenerId: number;

  @ApiProperty({ description: 'Tên hoạt động' })
  name: string;

  @ApiProperty({ description: 'Loại hoạt động', enum: ActivityType })
  activityType: ActivityType;

  @ApiProperty({ description: 'Thời gian thực hiện', type: String, format: 'date-time' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Tên cây' })
  plantName?: string;

  @ApiPropertyOptional({ description: 'Giai đoạn cây' })
  plantGrowStage?: string;

  @ApiPropertyOptional({ description: 'Chi tiết humidity (%)' })
  humidity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết temperature (°C)' })
  temperature?: number;

  @ApiPropertyOptional({ description: 'Chi tiết light intensity' })
  lightIntensity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết water level' })
  waterLevel?: number;

  @ApiPropertyOptional({ description: 'Chi tiết rainfall' })
  rainfall?: number;

  @ApiPropertyOptional({ description: 'Chi tiết soil moisture' })
  soilMoisture?: number;

  @ApiPropertyOptional({ description: 'Chi tiết soil pH' })
  soilPH?: number;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  details?: string;

  @ApiPropertyOptional({ description: 'Lý do thực hiện' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Ghi chú' })
  notes?: string;

  @ApiProperty({ description: 'Thời gian tạo', type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật', type: String, format: 'date-time' })
  updatedAt: Date;
}

export function mapToGardenActivityDto(activity: GardenActivity): GardenActivityDto {
  return {
    id: activity.id,
    gardenId: activity.gardenId,
    gardenerId: activity.gardenerId,
    name: activity.name,
    activityType: activity.activityType,
    timestamp: activity.timestamp,
    plantName: activity.plantName ||  undefined,
    plantGrowStage: activity.plantGrowStage || undefined,
    humidity: activity.humidity || undefined,
    temperature: activity.temperature || undefined,
    lightIntensity: activity.lightIntensity || undefined,
    waterLevel: activity.waterLevel || undefined,
    rainfall: activity.rainfall || undefined,
    soilMoisture: activity.soilMoisture || undefined,
    soilPH: activity.soilPH || undefined,
    details: activity.details || undefined,
    reason: activity.reason || undefined,
    notes: activity.notes || undefined,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}