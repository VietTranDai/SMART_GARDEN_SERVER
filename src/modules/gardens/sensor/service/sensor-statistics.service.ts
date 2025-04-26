import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SensorStatisticsDto } from '../dto/sensor-statistics.dto';
import { SensorAnalyticsDto } from '../dto/sensor-analytics.dto';
import { DailyAggregateDto } from '../dto/daily-aggregate.dto';

@Injectable()
export class SensorStatisticsService {
  private readonly logger = new Logger(SensorStatisticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sensorService: SensorService,
  ) {}

  /**
   * Calculate statistics for a sensor within a date range
   */
  async calculateStatistics(
    gardenerId: number,
    sensorId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<SensorStatisticsDto> {
    try {
      // Sensor check now includes metadata (like unit)
      const sensor = await this.sensorService.getSensorById(
        gardenerId,
        sensorId,
      );

      // Find all sensor data within the date range
      const sensorData = await this.prisma.sensorData.findMany({
        where: {
          sensorId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (sensorData.length === 0) {
        throw new NotFoundException(
          `No data found for sensor ${sensorId} within the specified date range`,
        );
      }

      // Calculate statistics
      const values = sensorData.map((data) => data.value);
      const totalReadings = values.length;
      const averageValue = this.calculateAverage(values);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const stdDeviation = this.calculateStandardDeviation(
        values,
        averageValue,
      );
      const firstReadingTime = sensorData[0].timestamp;
      const lastReadingTime = sensorData[sensorData.length - 1].timestamp;

      return {
        sensorId,
        sensorType: sensor.type,
        sensorName: sensor.name,
        startDate,
        endDate,
        totalReadings,
        averageValue,
        minValue,
        maxValue,
        stdDeviation,
        firstReadingTime,
        lastReadingTime,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate statistics for sensor ${sensorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate daily aggregated analytics for a sensor
   */
  async generateAnalytics(
    gardenerId: number,
    sensorId: number,
    startDateStr: string,
    endDateStr: string,
  ): Promise<SensorAnalyticsDto> {
    try {
      // Parse dates
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Set the time to start and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Sensor check now includes metadata (like unit)
      const sensor = await this.sensorService.getSensorById(
        gardenerId,
        sensorId,
      );

      // Find all sensor data within the date range
      const sensorData = await this.prisma.sensorData.findMany({
        where: {
          sensorId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (sensorData.length === 0) {
        throw new NotFoundException(
          `No data found for sensor ${sensorId} within the specified date range`,
        );
      }

      // Group data by date for daily aggregates
      const dataByDate = this.groupDataByDate(sensorData);
      const dailyAggregates: DailyAggregateDto[] = [];

      // Calculate daily aggregates
      for (const [date, data] of Object.entries(dataByDate)) {
        const values = data.map((d) => d.value);
        dailyAggregates.push({
          date,
          averageValue: this.calculateAverage(values),
          minValue: Math.min(...values),
          maxValue: Math.max(...values),
          readingsCount: values.length,
        });
      }

      // Calculate overall statistics (example: these might not be needed in the final DTO)
      // const allValues = sensorData.map((data) => data.value);
      // const overallAverage = this.calculateAverage(allValues);
      // const overallMinimum = Math.min(...allValues);
      // const overallMaximum = Math.max(...allValues);

      return {
        sensorId,
        sensorType: sensor.type,
        unit: sensor.unit || 'N/A',
        dailyData: dailyAggregates,
        // Remove properties not defined in SensorAnalyticsDto
        // overallAverage,
        // overallMinimum,
        // overallMaximum,
        // periodStart: startDateStr,
        // periodEnd: endDateStr,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate analytics for sensor ${sensorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Group sensor data by date
   */
  private groupDataByDate(sensorData: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const data of sensorData) {
      const date = data.timestamp.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(data);
    }

    return grouped;
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squareDiffs = values.map((value) => {
      const diff = value - mean;
      return diff * diff;
    });
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}
