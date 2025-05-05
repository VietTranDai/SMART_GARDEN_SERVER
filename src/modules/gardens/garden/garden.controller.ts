import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { GardenService } from './garden.service';
import { GardenDto } from './dto/garden.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('Garden')
@Controller('gardens')
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all gardens belonging to the current user' })
  @ApiOkResponse({
    description: 'List of your gardens returned successfully',
    type: [GardenDto],
  })
  async listMyGardens(@GetUser('id') userId: number): Promise<GardenDto[]> {
    // tận dụng service.findAll
    return this.gardenService.findAll(userId);
  }

  // ───────────────────────────────
  // DETAIL: GET /gardens/me/:id
  // ───────────────────────────────
  @Get('me/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific garden of current user by ID' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiOkResponse({
    description: 'Garden details returned successfully',
    type: GardenDto,
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to access this garden',
  })
  async getMyGardenById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) gardenId: number,
  ): Promise<GardenDto> {
    const garden = await this.gardenService.findOne(userId, gardenId);
    if (garden.gardenerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this garden',
      );
    }
    return garden;
  }
}
