import { 
    Controller, 
    Get, 
    Post, 
    Logger
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse,
    ApiBearerAuth 
  } from '@nestjs/swagger';
import { HealthSchedulerService } from '../service/health-scheduler.service';
  
  @ApiTags('Garden Health Scheduler')
  @Controller('admin/garden-health-scheduler')
  @ApiBearerAuth()
  export class HealthSchedulerController {
    private readonly logger = new Logger(HealthSchedulerController.name);
  
    constructor(
      private readonly schedulerService: HealthSchedulerService
    ) {}
  
    @Get('status')
    @ApiOperation({ 
      summary: 'Lấy trạng thái scheduler',
      description: 'Hiển thị thông tin về các tác vụ lập lịch đang chạy'
    })
    @ApiResponse({ status: 200, description: 'Trạng thái scheduler' })
    getSchedulerStatus() {
      return {
        success: true,
        message: 'Lấy trạng thái scheduler thành công',
        data: this.schedulerService.getSchedulerStatus(),
        timestamp: new Date().toISOString()
      };
    }
  
    @Post('run-manual-check')
    @ApiOperation({ 
      summary: 'Chạy kiểm tra thủ công',
      description: 'Thực hiện kiểm tra sức khỏe cho tất cả vườn ngay lập tức'
    })
    @ApiResponse({ status: 200, description: 'Kiểm tra thủ công hoàn thành' })
    async runManualHealthCheck(): Promise<any> {
      try {
        this.logger.log('🔄 Bắt đầu kiểm tra thủ công từ admin...');
        
        const summary = await this.schedulerService.runManualHealthCheckForAllGardens();
        
        return {
          success: true,
          message: 'Kiểm tra thủ công hoàn thành',
          data: summary,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error('❌ Lỗi kiểm tra thủ công:', error.stack);
        return {
          success: false,
          message: 'Lỗi khi thực hiện kiểm tra thủ công',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
  }