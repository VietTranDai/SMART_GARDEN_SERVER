// src/modules/advice/dto/advice-action.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AdviceActionDto {
  @ApiProperty({
    description: 'ID của lời khuyên',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description:
      'Tên hành động cần thực hiện, ví dụ: "Water plants", "Provide shade"',
    example: 'Water plants',
  })
  action: string;

  @ApiProperty({
    description: 'Mô tả ngắn gọn cách thực hiện hành động',
    example: 'Soil moisture is below the optimal range; watering is needed',
  })
  description: string;

  @ApiProperty({
    description: 'Lý do thu thập từ dữ liệu sensor hoặc thời tiết',
    example: 'Soil moisture (25%) is below the growth stage minimum (30%)',
  })
  reason: string;

  @ApiProperty({
    description: 'Độ ưu tiên của hành động',
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    example: 'HIGH',
  })
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiProperty({
    description:
      'Thời điểm gợi ý thực hiện hành động (có thể là "morning", "noon", "evening" hoặc chuỗi tuỳ chỉnh như "Sáng mai")',
    example: 'morning',
  })
  suggestedTime: string;

  @ApiProperty({
    description:
      'Phân loại lời khuyên, ví dụ: "WATERING", "TEMPERATURE", "LIGHT", "HUMIDITY", v.v.',
    example: 'WATERING',
  })
  category: string;
}
