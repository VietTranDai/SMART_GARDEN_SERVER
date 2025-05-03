import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'; // Optional: for Swagger documentation

@ApiTags('Locations') // Optional: Group endpoints in Swagger
@Controller('locations')
export class LocationController {
  private readonly logger = new Logger(LocationController.name);

  constructor(private readonly locationService: LocationService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Get all provinces' })
  @ApiResponse({ status: 200, description: 'List of all provinces' })
  async getProvinces() {
    return this.locationService.findAllProvinces();
  }

  @Get('provinces/:provinceCode/districts')
  @ApiOperation({ summary: 'Get districts by province code' })
  @ApiParam({
    name: 'provinceCode',
    description: 'The code of the province',
    example: '79',
  })
  @ApiResponse({
    status: 200,
    description: 'List of districts in the province',
  })
  @ApiResponse({
    status: 404,
    description: 'Province not found or has no districts',
  })
  async getDistricts(@Param('provinceCode') provinceCode: string) {
    const districts =
      await this.locationService.findDistrictsByProvince(provinceCode);
    // Optional: check if province exists or if districts array is empty and return 404
    if (!districts || districts.length === 0) {
      // Add a check in service or here to confirm province exists before checking districts
      // this.logger.warn(`No districts found for province code: ${provinceCode}`);
      // throw new NotFoundException(`No districts found for province code: ${provinceCode}`);
    }
    return districts;
  }

  @Get('districts/:districtCode/wards')
  @ApiOperation({ summary: 'Get wards by district code' })
  @ApiParam({
    name: 'districtCode',
    description: 'The code of the district',
    example: '769',
  })
  @ApiResponse({ status: 200, description: 'List of wards in the district' })
  @ApiResponse({
    status: 404,
    description: 'District not found or has no wards',
  })
  async getWards(@Param('districtCode') districtCode: string) {
    const wards = await this.locationService.findWardsByDistrict(districtCode);
    // Optional: check if district exists or if wards array is empty
    if (!wards || wards.length === 0) {
      // Add a check in service or here
      // this.logger.warn(`No wards found for district code: ${districtCode}`);
      // throw new NotFoundException(`No wards found for district code: ${districtCode}`);
    }
    return wards;
  }

  @Get('wards/:wardCode')
  @ApiOperation({ summary: 'Get a specific ward by code' })
  @ApiParam({
    name: 'wardCode',
    description: 'The code of the ward',
    example: '27133',
  })
  @ApiResponse({ status: 200, description: 'Ward details' })
  @ApiResponse({ status: 404, description: 'Ward not found' })
  async getWard(@Param('wardCode') wardCode: string) {
    const ward = await this.locationService.findWardByCode(wardCode);
    if (!ward) {
      this.logger.warn(`Ward not found for code: ${wardCode}`);
      throw new NotFoundException(`Ward not found with code: ${wardCode}`);
    }
    return ward;
  }

  // --- Geocoding Trigger Endpoint ---
  // Consider adding authentication/authorization (e.g., @UseGuards(AdminGuard))
  @Post('admin/start-geocoding')
  @ApiOperation({
    summary: 'Start the process to geocode wards without coordinates',
  })
  @ApiResponse({ status: 202, description: 'Geocoding process started' })
  @ApiResponse({
    status: 409,
    description: 'Geocoding process is already running',
  })
  @HttpCode(HttpStatus.ACCEPTED) // Return 202 Accepted
  async startGeocoding() {
    this.logger.log('Received request to start geocoding process.');
    // No await here - start the process in the background
    this.locationService
      .startGeocodingProcess()
      .then((result) => {
        this.logger.log(
          `Background geocoding finished. Processed: ${result.processed}, Failed: ${result.failed}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Error in background geocoding process: ${error.message}`,
          error.stack,
        );
      });

    return { message: 'Geocoding process initiated in the background.' };
    // If you need to prevent multiple runs, the service already handles this
    // const result = await this.locationService.startGeocodingProcess();
    // if (result.processed === 0 && result.failed === 0) {
    //   // Could indicate it was already running or no wards needed processing
    //   // Potentially return a different status/message like Conflict 409
    //   // throw new ConflictException('Geocoding process is already running or no wards to process.');
    // }
    // return { message: `Geocoding process started. Wards found: ${result.processed + result.failed}` };
  }
}
