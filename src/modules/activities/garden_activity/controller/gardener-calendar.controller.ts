import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { GardenActivityCalendarDto } from '../dto/garden-activity-calendar.dto';
import { GardenerCalendarService } from '../service/garden-calendar.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('Gardener Calendar')
@Controller('gardener-calendar')
@ApiBearerAuth()
export class GardenerCalendarController {
  constructor(
    private readonly gardenerCalendarService: GardenerCalendarService
  ) {}

  @Get('/:gardenId')
  async getGardenCalendar(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number
  ): Promise<GardenActivityCalendarDto | null> {
    return this.gardenerCalendarService.getGardenCalendarById(userId, gardenId);
  }
}