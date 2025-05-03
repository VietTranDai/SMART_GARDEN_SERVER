import { ApiProperty } from '@nestjs/swagger';

export class RefreshWeatherResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z', required: false })
  lastUpdated?: Date;

  @ApiProperty({ example: 'Optional message', required: false })
  message?: string;
}
