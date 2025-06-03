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
  UsePipes,
  ValidationPipe,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
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
  WateringDecisionRequestDto,
  WateringDecisionDto, 
  WateringStatsDto, 
} from '../dto/watering-decision-model.dto';

@ApiTags('Watering Decision Model')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('watering-decision')
export class WateringDecisionModelController {
  constructor(
    private readonly wateringDecisionService: WateringDecisionModelService,
  ) {}

  @Post('garden/:gardenId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Lấy quyết định tưới nước cho vườn từ AI model',
    description: 'Lấy dữ liệu cảm biến mới nhất từ database và gửi đến AI model để nhận quyết định tưới nước. Có thể chỉ định thời gian dự định tưới nước hoặc dùng thời gian hiện tại.'
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
    @Body() requestDto: WateringDecisionRequestDto = {},
  ): Promise<WateringDecisionDto> {
    try {
      if (isNaN(gardenId) || gardenId < 1) {
        throw new BadRequestException('Garden ID không hợp lệ');
      }

      return await this.wateringDecisionService.getWateringDecision(userId, gardenId, requestDto);
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error in getWateringDecision controller:', error);
      throw new InternalServerErrorException('Failed to get watering decision');
    }
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
    try {
      if (isNaN(gardenId) || gardenId < 1) {
        throw new BadRequestException('Garden ID không hợp lệ');
      }

      if (days < 1 || days > 365) {
        throw new BadRequestException('Số ngày phải từ 1 đến 365');
      }

      return await this.wateringDecisionService.getWateringStatsByGarden(userId, gardenId, days);
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error in getWateringStats controller:', error);
      throw new InternalServerErrorException('Failed to fetch watering statistics');
    }
  }

  @Get('test-ai')
  @ApiOperation({ 
    summary: 'Kiểm tra kết nối AI model',
    description: 'Endpoint để kiểm tra AI model có hoạt động không'
  })
  @ApiOkResponse({ description: 'AI model hoạt động bình thường' })
  @ApiInternalServerErrorResponse({ description: 'AI model không phản hồi' })
  async testAIConnection() {
    try {
      return await this.wateringDecisionService.testAIConnection();
    } catch (error) {
      console.error('Error in testAIConnection controller:', error);
      throw new InternalServerErrorException('Failed to test AI connection');
    }
  }
}
