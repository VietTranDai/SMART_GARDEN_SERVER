import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PlantAdviceService } from '../service/plant-advice.service';
import { PlantAdviceResponseDto } from '../dto/plant-advice.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Plant Advice')
@ApiBearerAuth()
@Controller('gardens/:gardenId/plant-advice')
export class PlantAdviceController {
  constructor(private readonly plantAdviceService: PlantAdviceService) {}

  @Get()
  @ApiOperation({ summary: 'Get plant advice for a specific garden' })
  @ApiParam({ name: 'gardenId', description: 'ID of the garden', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved plant advice.',
    type: PlantAdviceResponseDto, // This helps Swagger understand the response structure
  })
  @ApiResponse({ status: 404, description: 'Garden not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getPlantAdvice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<PlantAdviceResponseDto> {
    return this.plantAdviceService.getPlantAdvice(gardenId);
  }
}
