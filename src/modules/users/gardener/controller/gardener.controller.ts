import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GardenerService } from '../service/gardener.service';
import {
  GardenerDto,
  CreateGardenerDto,
  UpdateGardenerDto,
} from '../dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery, ApiParam, ApiOkResponse,
} from '@nestjs/swagger';
import { GardenerProfileDto } from '../dto/gardener-stats.dto';
import { GetUser } from '../../../auth/decorators/get-user.decorator';

@ApiTags('gardeners')
@Controller('gardeners')
export class GardenerController {
  constructor(private readonly gardenerService: GardenerService) {}

  // ---- CRUD Operations ----

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new gardener' })
  @ApiResponse({
    status: 201,
    description: 'The gardener has been successfully created',
    type: GardenerDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - gardener already exists for this user',
  })
  create(@Body() createGardenerDto: CreateGardenerDto) {
    return this.gardenerService.create(createGardenerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gardeners with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of gardeners',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.gardenerService.findAll(page, limit, sortBy, sortOrder);
  }

  @Get(':gardenerId')
  @ApiOperation({ summary: 'Get gardener profile with stats' })
  @ApiParam({ name: 'gardenerId', type: Number })
  @ApiOkResponse({ type: GardenerProfileDto })
  async getProfile(
    @GetUser('id') userId: number,
    @Param('gardenerId', ParseIntPipe) gardenerId: number,
  ): Promise<GardenerProfileDto> {
    return this.gardenerService.getGardenerProfile(userId, gardenerId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get gardener leaderboard' })
  @ApiResponse({
    status: 200,
    description: 'Return gardener leaderboard',
    type: [GardenerDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of gardeners to return',
  })
  getLeaderboard(@Query('limit') limit?: number) {
    return this.gardenerService.getLeaderboard(limit);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get gardener by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the gardener with the specified user ID',
    type: GardenerDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Gardener not found',
  })
  findOne(@Param('userId', ParseIntPipe) userId: number) {
    return this.gardenerService.findById(userId);
  }

  @Put(':userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a gardener' })
  @ApiResponse({
    status: 200,
    description: 'The gardener has been successfully updated',
    type: GardenerDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Gardener not found',
  })
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateGardenerDto: UpdateGardenerDto,
  ) {
    return this.gardenerService.update(userId, updateGardenerDto);
  }

  @Delete(':userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a gardener' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'The gardener has been successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Gardener not found',
  })
  remove(@Param('userId', ParseIntPipe) userId: number) {
    return this.gardenerService.remove(userId);
  }
}
