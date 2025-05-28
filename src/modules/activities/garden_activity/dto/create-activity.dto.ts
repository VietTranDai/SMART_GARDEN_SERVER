import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ description: 'ID của vườn', example: 1 })
  gardenId: number;

  @ApiProperty({ description: 'ID của người thực hiện', example: 5 })
  gardenerId: number;

  @ApiProperty({ description: 'Tên hoạt động', example: 'Watering Garden' })
  name: string;

  @ApiProperty({ description: 'Loại hoạt động', enum: ActivityType, example: ActivityType.WATERING })
  activityType: ActivityType;

  @ApiProperty({ description: 'Thời gian thực hiện', example: '2025-05-05T10:00:00Z' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Tên cây', example: 'Tomato' })
  plantName?: string;

  @ApiPropertyOptional({ description: 'Giai đoạn cây', example: 'Flowering' })
  plantGrowStage?: string;

  @ApiPropertyOptional({ description: 'Chi tiết môi trường - humidity (%)', example: 75 })
  humidity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết môi trường - temperature (°C)', example: 28 })
  temperature?: number;

  @ApiPropertyOptional({ description: 'Chi tiết môi trường - light intensity (lux)', example: 12000 })
  lightIntensity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết môi trường - water level (cm)', example: 15 })
  waterLevel?: number;

  @ApiPropertyOptional({ description: 'Chi tiết môi trường - rainfall (mm)', example: 0 })
  rainfall?: number;

  @ApiPropertyOptional({ description: 'Chi tiết môi trường - soil moisture (%)', example: 40 })
  soilMoisture?: number;

  @ApiPropertyOptional({ description: 'Chi tiết môi trường - soil pH', example: 6.5 })
  soilPH?: number;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết', example: 'Watered 10 liters' })
  details?: string;

  @ApiPropertyOptional({ description: 'Lý do thực hiện', example: 'Routine maintenance' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Plants look healthy' })
  notes?: string;
}