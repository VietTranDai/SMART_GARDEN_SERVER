import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { WateringDecisionModelService } from '../service/watering-decision-model.service';
import { 
    CreateWateringDecisionDto,
  WateringDecisionDto, 
  WateringStatsDto, 
} from '../dto/watering-decision-model.dto';

@ApiTags('Watering Decision Model')
@ApiBearerAuth()
@Controller('watering-decision')
export class WateringDecisionModelController {
  constructor(
    private readonly wateringDecisionService: WateringDecisionModelService,
  ) {}

  @Get('garden/:gardenId')
  @ApiOperation({ 
    summary: 'Lấy quyết định tưới nước cho vườn từ AI model',
    description: 'Lấy dữ liệu cảm biến mới nhất của vườn và gửi đến AI model để nhận quyết định tưới nước'
  })
  @ApiParam({ name: 'gardenId', description: 'ID của vườn', type: 'number' })
  @ApiOkResponse({ description: 'Quyết định tưới nước thành công', type: WateringDecisionDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy vườn hoặc dữ liệu cảm biến' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập vườn này' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ hoặc AI model' })
  async getWateringDecision(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<WateringDecisionDto> {
    if (isNaN(gardenId) || gardenId < 1) {
      throw new BadRequestException('Garden ID không hợp lệ');
    }

    return this.wateringDecisionService.getWateringDecisionByGarden(userId, gardenId);
  }

  @Post('garden/:gardenId/custom')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Tạo quyết định tưới nước với dữ liệu cảm biến tùy chỉnh',
    description: 'Gửi dữ liệu cảm biến tùy chỉnh đến AI model để nhận quyết định tưới nước'
  })
  @ApiParam({ name: 'gardenId', description: 'ID của vườn', type: 'number' })
  @ApiOkResponse({ description: 'Quyết định tưới nước thành công', type: WateringDecisionDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập vườn này' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ hoặc AI model' })
  async createCustomWateringDecision(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() createDto: CreateWateringDecisionDto,
  ): Promise<WateringDecisionDto> {
    if (isNaN(gardenId) || gardenId < 1) {
      throw new BadRequestException('Garden ID không hợp lệ');
    }

    return this.wateringDecisionService.createCustomWateringDecision(userId, gardenId, createDto);
  }

  @Get('garden/:gardenId/stats')
  @ApiOperation({ 
    summary: 'Lấy thống kê quyết định tưới nước cho vườn',
    description: 'Thống kê các quyết định tưới nước đã được đưa ra trong khoảng thời gian'
  })
  @ApiParam({ name: 'gardenId', description: 'ID của vườn', type: 'number' })
  @ApiQuery({ name: 'days', description: 'Số ngày thống kê (mặc định: 7)', required: false })
  @ApiOkResponse({ description: 'Thống kê thành công', type: WateringStatsDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập vườn này' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getWateringStats(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 7,
  ): Promise<WateringStatsDto> {
    if (isNaN(gardenId) || gardenId < 1) {
      throw new BadRequestException('Garden ID không hợp lệ');
    }

    if (days < 1 || days > 365) {
      throw new BadRequestException('Số ngày phải từ 1 đến 365');
    }

    return this.wateringDecisionService.getWateringStatsByGarden(userId, gardenId, days);
  }

  @Get('test-ai')
  @ApiOperation({ 
    summary: 'Kiểm tra kết nối AI model',
    description: 'Endpoint để kiểm tra AI model có hoạt động không'
  })
  @ApiOkResponse({ description: 'AI model hoạt động bình thường' })
  @ApiInternalServerErrorResponse({ description: 'AI model không phản hồi' })
  async testAIConnection() {
    return this.wateringDecisionService.testAIConnection();
  }
}
