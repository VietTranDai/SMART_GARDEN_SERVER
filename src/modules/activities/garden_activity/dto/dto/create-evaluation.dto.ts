import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluatorType } from '@prisma/client';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'Loại evaluator', enum: EvaluatorType, example: EvaluatorType.USER })
  evaluatorType: EvaluatorType;

  @ApiPropertyOptional({ description: 'ID của evaluator (nếu USER)', example: 5 })
  gardenerId?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - humidity (%)', example: 70 })
  humidity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - temperature (°C)', example: 27 })
  temperature?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - light intensity (lux)', example: 10000 })
  lightIntensity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - water level (cm)', example: 14 })
  waterLevel?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - rainfall (mm)', example: 0 })
  rainfall?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - soil moisture (%)', example: 38 })
  soilMoisture?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - soil pH', example: 6.3 })
  soilPH?: number;

  @ApiProperty({ description: 'Thời gian đánh giá', example: '2025-05-05T11:00:00Z' })
  evaluatedAt: Date;

  @ApiPropertyOptional({ description: 'Kết quả đánh giá', example: 'Good' })
  outcome?: string;

  @ApiPropertyOptional({ description: 'Điểm đánh giá', example: 4 })
  rating?: number;

  @ApiPropertyOptional({ description: 'Metrics dạng JSON', example: { growth: '10cm' } })
  metrics?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Bình luận thêm', example: 'Better watering next time' })
  comments?: string;
}
