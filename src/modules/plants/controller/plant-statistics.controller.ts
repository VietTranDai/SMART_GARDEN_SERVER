import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlantStatisticsService } from '../service/plant-statistics.service';
import { PlantStatisticsResponseDto } from '../dto/plant-statistics.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('Plants')
@ApiBearerAuth()
@Controller('gardens/:gardenId/plant-statistics')
export class PlantStatisticsController {
  constructor(
    private readonly plantStatisticsService: PlantStatisticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get detailed plant statistics for a garden' })
  @ApiResponse({
    status: 200,
    description: 'Detailed plant statistics retrieved successfully.',
    type: PlantStatisticsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid garden ID format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden resource. User may not own this garden or is not a gardener.',
  })
  @ApiResponse({ status: 404, description: 'Garden not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getPlantStatistics(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<PlantStatisticsResponseDto> {
    return this.plantStatisticsService.getPlantStatistics(gardenId, userId);
  }
}
