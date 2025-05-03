import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { Wards, Districts, Provinces } from '@prisma/client';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError } from 'axios';

// Utility function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class LocationService implements OnModuleInit {
  private readonly logger = new Logger(LocationService.name);
  private isGeocoding = false; // Prevent multiple geocoding processes

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Optional: Start geocoding when the module initializes
  async onModuleInit() {
    this.logger.log(
      'LocationService initialized. Checking for wards to geocode...',
    );
    // Decide if you want to auto-start geocoding. Be cautious in production.
    // await this.startGeocodingProcess();
  }

  async findAllProvinces(): Promise<Provinces[]> {
    return this.prisma.provinces.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findDistrictsByProvince(provinceCode: string): Promise<Districts[]> {
    return this.prisma.districts.findMany({
      where: { province_code: provinceCode },
      orderBy: { name: 'asc' },
    });
  }

  async findWardsByDistrict(districtCode: string): Promise<Wards[]> {
    return this.prisma.wards.findMany({
      where: { district_code: districtCode },
      orderBy: { name: 'asc' },
    });
  }

  async findWardByCode(wardCode: string): Promise<Wards | null> {
    return this.prisma.wards.findUnique({
      where: { code: wardCode },
      include: {
        district: {
          include: {
            province: true,
          },
        },
      },
    });
  }

  private async findWardsNeedingGeocoding(): Promise<
    (Wards & { district: Districts & { province: Provinces } })[]
  > {
    return this.prisma.wards.findMany({
      where: {
        OR: [{ latitude: null }, { longitude: null }],
      },
      include: {
        district: {
          include: {
            province: true,
          },
        },
      },
      orderBy: { code: 'asc' }, // Process in a consistent order
      // Limit the batch size if needed
      // take: 100,
    });
  }

  async geocodeWard(
    wardCode: string,
  ): Promise<{ lat: number; lon: number } | null> {
    const ward = await this.prisma.wards.findUnique({
      where: { code: wardCode },
      include: {
        district: {
          include: {
            province: true,
          },
        },
      },
    });

    if (!ward || !ward.district || !ward.district.province) {
      this.logger.warn(`Ward ${wardCode} or its relations not found.`);
      return null;
    }

    // Use full_name for better accuracy in Nominatim structured query
    const wardName = ward.full_name; // e.g., Phường Dĩ An
    const districtName = ward.district.full_name; // e.g., Thành phố Dĩ An
    const provinceName = ward.district.province.full_name; // e.g., Tỉnh Bình Dương

    const url = 'https://nominatim.openstreetmap.org/search';
    const params = {
      street: wardName,
      city: districtName,
      state: provinceName,
      country: 'Vietnam',
      format: 'jsonv2',
      limit: 1,
      countrycodes: 'vn',
      'accept-language': 'vi', // Request Vietnamese names if available
    };

    const headers = {
      'User-Agent': 'SmartGardenApp/1.0 (your.email@example.com)', // Replace with your app info
    };

    this.logger.debug(
      `Geocoding: ${wardName}, ${districtName}, ${provinceName}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params, headers }).pipe(
          timeout(10000), // 10 second timeout
          catchError((error: AxiosError) => {
            this.logger.error(
              `Nominatim API error for ward ${wardCode} (${wardName}): ${error.message}`,
              error.stack,
            );
            if (error.response) {
              this.logger.error(
                `Nominatim Response: ${JSON.stringify(error.response.data)}`,
              );
            }
            // Rethrow or handle specific errors (like 429 Too Many Requests)
            throw error;
          }),
        ),
      );

      const data = response.data;
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        if (!isNaN(lat) && !isNaN(lon)) {
          await this.prisma.wards.update({
            where: { code: wardCode },
            data: { latitude: lat, longitude: lon },
          });
          this.logger.log(
            `✅ Geocoded ${wardCode} (${wardName}): ${lat}, ${lon}`,
          );
          return { lat, lon };
        } else {
          this.logger.warn(
            `⚠️ Invalid coordinates received for ${wardCode} (${wardName}): ${data[0].lat}, ${data[0].lon}`,
          );
        }
      } else {
        this.logger.warn(
          `⚠️ No geocoding result for ${wardCode} (${wardName})`,
        );
      }
    } catch (error) {
      // Error already logged in catchError or could be a timeout
      this.logger.error(
        `Failed to geocode ward ${wardCode} (${wardName}) after request attempt.`,
      );
    }

    // Mark as failed (e.g., set a specific non-null value?) or leave as null to retry later
    // For simplicity, we leave it null here to be picked up in the next run.
    return null;
  }

  async startGeocodingProcess(): Promise<{
    processed: number;
    failed: number;
  }> {
    if (this.isGeocoding) {
      this.logger.warn('Geocoding process already running.');
      return { processed: 0, failed: 0 };
    }

    this.isGeocoding = true;
    this.logger.log('🚀 Starting geocoding process...');
    let processedCount = 0;
    let failedCount = 0;

    try {
      const wardsToGeocode = await this.findWardsNeedingGeocoding();
      this.logger.log(
        `⏳ Found ${wardsToGeocode.length} wards needing geocoding.`,
      );

      for (const ward of wardsToGeocode) {
        try {
          const result = await this.geocodeWard(ward.code);
          if (result) {
            processedCount++;
          } else {
            failedCount++;
            this.logger.warn(
              `-> Failed to geocode ${ward.code} (${ward.full_name})`,
            );
          }
        } catch (error) {
          // Catch errors from geocodeWard if they weren't handled internally
          this.logger.error(
            `Unhandled error processing ward ${ward.code}: ${error.message}`,
            error.stack,
          );
          failedCount++;
        } finally {
          // Rate limit: wait 1 second before the next request
          await delay(1000);
        }
      }
      this.logger.log(
        `🏁 Geocoding process finished. Processed: ${processedCount}, Failed: ${failedCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Fatal error during geocoding process: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isGeocoding = false; // Allow the process to run again later
    }
    return { processed: processedCount, failed: failedCount };
  }
}
