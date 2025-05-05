import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityEvaluation, EvaluatorType } from '@prisma/client';

export class ActivityEvaluationDto {
  @ApiProperty({ description: 'ID evaluation', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID activity', example: 10 })
  gardenActivityId: number;

  @ApiProperty({ description: 'Loại evaluator', enum: EvaluatorType })
  evaluatorType: EvaluatorType;

  @ApiPropertyOptional({ description: 'ID evaluator nếu USER', example: 5 })
  gardenerId?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - humidity (%)' })
  humidity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - temperature (°C)' })
  temperature?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - light intensity (lux)' })
  lightIntensity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - water level (cm)' })
  waterLevel?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - rainfall (mm)' })
  rainfall?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - soil moisture (%)' })
  soilMoisture?: number;

  @ApiPropertyOptional({ description: 'Chi tiết cảm quan - soil pH' })
  soilPH?: number;

  @ApiProperty({ description: 'Thời gian đánh giá', type: String, format: 'date-time' })
  evaluatedAt: Date;

  @ApiPropertyOptional({ description: 'Kết quả đánh giá' })
  outcome?: string;

  @ApiPropertyOptional({ description: 'Điểm đánh giá' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Metrics dạng JSON' })
  metrics?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Bình luận thêm' })
  comments?: string;

  @ApiProperty({ description: 'Created at', type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', type: String, format: 'date-time' })
  updatedAt: Date;
}

export function mapToActivityEvaluationDto(evalModel: ActivityEvaluation): ActivityEvaluationDto {
  return {
    id: evalModel.id,
    gardenActivityId: evalModel.gardenActivityId,
    evaluatorType: evalModel.evaluatorType,
    gardenerId: evalModel.gardenerId || undefined,
    humidity: evalModel.humidity || undefined,
    temperature: evalModel.temperature || undefined,
    lightIntensity: evalModel.lightIntensity || undefined,
    waterLevel: evalModel.waterLevel || undefined,
    rainfall: evalModel.rainfall || undefined,
    soilMoisture: evalModel.soilMoisture || undefined,
    soilPH: evalModel.soilPH || undefined,
    evaluatedAt: evalModel.evaluatedAt,
    outcome: evalModel.outcome || undefined,
    rating: evalModel.rating || undefined,
    metrics: evalModel.metrics as any,
    comments: evalModel.comments || undefined,
    createdAt: evalModel.createdAt,
    updatedAt: evalModel.updatedAt,
  };
}

export function mapToActivityEvaluationDtoList(evals: ActivityEvaluation[]): ActivityEvaluationDto[] {
  return evals.map(mapToActivityEvaluationDto);
}

