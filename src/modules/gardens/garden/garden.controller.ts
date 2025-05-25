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
  Put,
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
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GardenService } from './garden.service';
import { GardenDto } from './dto/garden.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import { GardenPlantDetailsDto } from './dto/garden-plant-details.dto';

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

  @Post('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new garden' })
  @ApiCreatedResponse({
    description: 'Garden created successfully',
    type: GardenDto,
  })
  @ApiConflictResponse({ description: 'Garden with this key already exists' })
  async createGarden(
    @GetUser('id') userId: number,
    @Body() createGardenDto: CreateGardenDto,
  ): Promise<GardenDto> {
    return this.gardenService.create(userId, createGardenDto);
  }

  @Put('me/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a garden by ID' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiOkResponse({
    description: 'Garden updated successfully',
    type: GardenDto,
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this garden',
  })
  async updateGarden(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) gardenId: number,
    @Body() updateGardenDto: UpdateGardenDto,
  ): Promise<GardenDto> {
    await this.gardenService.checkGardenOwnership(userId, gardenId);
    return this.gardenService.update(userId, gardenId, updateGardenDto);
  }

  @Delete('me/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a garden by ID' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiNoContentResponse({ description: 'Garden deleted successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to delete this garden',
  })
  async deleteGarden(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) gardenId: number,
  ): Promise<void> {
    await this.gardenService.checkGardenOwnership(userId, gardenId);
    return this.gardenService.remove(gardenId);
  }

  // @Get('me/:gardenId/advice')
  // @ApiOperation({
  //   summary: 'Get care recommendations for a garden by its ID',
  //   description:
  //     'Trả về danh sách các hành động tưới nước và chăm sóc cây dựa trên dữ liệu sensor và thời tiết cho gardenId đã cho.',
  // })
  // @ApiParam({
  //   name: 'gardenId',
  //   description: 'ID của khu vườn',
  //   type: Number,
  //   example: 1,
  // })
  // @ApiOkResponse({
  //   description: 'Danh sách lời khuyên được trả về thành công',
  //   type: [AdviceActionDto],
  // })
  // @ApiNotFoundResponse({
  //   description:
  //     'Không tìm thấy garden với ID tương ứng hoặc thiếu thông tin giai đoạn sinh trưởng',
  // })
  // async getAdvice(
  //   @GetUser('id') userId: number,
  //   @Param('gardenId', ParseIntPipe) gardenId: number,
  // ): Promise<AdviceActionDto[]> {
  //   // Kiểm tra quyền
  //   await this.gardenService.checkGardenOwnership(userId, gardenId);
  //   return this.gardenAdviceService.getAdvice(gardenId);
  // }

  @Get('me/:gardenId/plant-details')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get plant details for a garden by ID' })
  @ApiParam({ name: 'gardenId', description: 'Garden ID', type: Number })
  @ApiOkResponse({
    description: 'Plant details returned successfully',
    type: GardenPlantDetailsDto,
  })
  @ApiNotFoundResponse({ description: 'Garden or plant details not found' })
  async getPlantDetails(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<GardenPlantDetailsDto> {
    await this.gardenService.checkGardenOwnership(userId, gardenId);
    return this.gardenService.getPlantDetails(gardenId);
  }

  @Get('me/:gardenId/photos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get photos for a garden by ID' })
  @ApiParam({ name: 'gardenId', description: 'Garden ID', type: Number })
  @ApiOkResponse({
    description: 'Garden photos returned successfully',
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  async getGardenPhotos(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ) {
    await this.gardenService.checkGardenOwnership(userId, gardenId);
    return this.gardenService.getGardenPhotos(gardenId);
  }

  @Get('me/:gardenId/sensor-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sensor history for a garden by ID' })
  @ApiParam({ name: 'gardenId', description: 'Garden ID', type: Number })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days of history to retrieve (default: 7)',
  })
  @ApiOkResponse({
    description: 'Sensor history returned successfully',
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  async getSensorHistory(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('days', new ParseIntPipe({ optional: true })) days = 7,
  ) {
    await this.gardenService.checkGardenOwnership(userId, gardenId);
    return this.gardenService.getSensorHistory(gardenId, days);
  }
}
