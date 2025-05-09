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
import { AdviceActionDto, AdviceDto } from './dto/advice-action.dto';
import { GardenAdviceService } from './garden-advice.service';

@ApiTags('Garden')
@Controller('gardens')
export class GardenController {
  constructor(private readonly gardenService: GardenService,
              private readonly gardenAdviceService: GardenAdviceService) {}

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

  @Get(':id/advice')
  @ApiOperation({
    summary: 'Get care recommendations for a garden by its ID',
    description:
      'Trả về danh sách các hành động tưới nước và chăm sóc cây dựa trên dữ liệu sensor và thời tiết cho gardenId đã cho.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của khu vườn',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Danh sách lời khuyên được trả về thành công',
    type: AdviceDto,
  })
  @ApiNotFoundResponse({
    description:
      'Không tìm thấy garden với ID tương ứng hoặc thiếu thông tin giai đoạn sinh trưởng',
  })
  async getAdvice(
    @Param('id', ParseIntPipe) gardenId: number,
  ): Promise<AdviceDto> {
    const actions = await this.gardenAdviceService.getAdvice(gardenId);
    return { actions };
  }
}
