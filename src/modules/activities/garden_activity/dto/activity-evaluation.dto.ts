import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluatorType, ActivityEvaluation } from '@prisma/client';

export class ActivityEvaluationDto {
  @ApiProperty({ description: 'ID của đánh giá', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của hoạt động được đánh giá', example: 10 })
  activityId: number;

  @ApiProperty({ description: 'Loại người đánh giá', enum: EvaluatorType })
  evaluatorType: EvaluatorType;

  @ApiPropertyOptional({
    description: 'ID của người làm vườn thực hiện đánh giá (nếu là USER)',
    example: 5,
  })
  gardenerId?: number;

  @ApiProperty({
    description: 'Thời điểm đánh giá',
    type: String,
    format: 'date-time',
  })
  evaluatedAt: Date;

  @ApiPropertyOptional({
    description: 'Kết quả/Hậu quả được ghi nhận từ hoạt động',
  })
  outcome?: string;

  @ApiPropertyOptional({ description: 'Điểm đánh giá (ví dụ: 1-5 sao)' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Các chỉ số đo lường cụ thể (dạng JSON)',
    type: Object,
  })
  metrics?: any; // Prisma.JsonValue

  @ApiPropertyOptional({ description: 'Bình luận/ghi chú chi tiết' })
  comments?: string;

  @ApiProperty({
    description: 'Thời gian tạo bản ghi đánh giá',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật bản ghi đánh giá',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}

export function mapToActivityEvaluationDto(
  evaluation: ActivityEvaluation & { gardenActivityId?: number },
): ActivityEvaluationDto {
  return {
    id: evaluation.id,
    activityId: evaluation.gardenActivityId || (evaluation as any).activityId,
    evaluatorType: evaluation.evaluatorType,
    gardenerId: evaluation.gardenerId || undefined,
    evaluatedAt: evaluation.evaluatedAt,
    outcome: evaluation.outcome || undefined,
    rating: evaluation.rating || undefined,
    metrics: evaluation.metrics,
    comments: evaluation.comments || undefined,
    createdAt: evaluation.createdAt,
    updatedAt: evaluation.updatedAt,
  };
}

export function mapToActivityEvaluationDtoList(
  evaluations: ActivityEvaluation[],
): ActivityEvaluationDto[] {
  return evaluations.map(mapToActivityEvaluationDto);
}
