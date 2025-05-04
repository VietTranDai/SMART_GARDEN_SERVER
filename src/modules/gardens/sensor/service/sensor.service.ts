import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SensorType, Sensor, SensorData, Prisma } from '@prisma/client';
import { RegisterSensorDto } from '../dto/register-sensor.dto';
import { CreateSensorDataDto } from '../dto/create-sensor-data.dto';
import { randomUUID } from 'crypto';
import { GardenService } from '../../garden/service/garden.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SensorMetadataService } from './sensor-metadata.service';
import { UpdateSensorDto } from '../dto/update-sensor.dto';

export type SensorWithMetadata = Sensor & {
  name?: string;
  description?: string;
  location?: string;
  unit?: string;
};

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gardenService: GardenService,
    private readonly metadataService: SensorMetadataService,
  ) {}

  /**
   * Register a new sensor for a garden
   */
  async registerSensor(
    gardenerId: number,
    registerSensorDto: RegisterSensorDto,
  ): Promise<SensorWithMetadata> {
    const { gardenId, type, name, description, location, unit } =
      registerSensorDto;

    try {
      // Verify garden ownership
      const gardenOwnership = await this.gardenService.checkGardenOwnership(
        gardenerId,
        gardenId,
      );
      if (!gardenOwnership) {
        throw new ForbiddenException(
          'You do not have permission to register sensor for this garden',
        );
      }

      // Generate a unique sensor key
      const sensorKey = this.generateSensorKey(type);

      // Create the sensor
      const sensor = await this.prisma.sensor.create({
        data: {
          sensorKey,
          type,
          gardenId,
        },
      });

      // Store the metadata separately
      if (name) {
        this.metadataService.create(
          sensor.id,
          name,
          description,
          location,
          unit,
        );
      }

      // Fetch potentially created metadata to include unit
      const metadata = this.metadataService.findOne(sensor.id);

      const sensorWithMetadata: SensorWithMetadata = {
        ...sensor,
        name: metadata?.name,
        description: metadata?.description,
        location: metadata?.location,
        unit: metadata?.unit,
      };

      this.logger.log(
        `Sensor (${type}) registered successfully with ID: ${sensor.id}`,
      );
      return sensorWithMetadata;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      if (error instanceof PrismaClientKnownRequestError) {
        // Handle unique constraint violations (unlikely for sensor but possible)
        if (error.code === 'P2002') {
          throw new ConflictException('A sensor with this key already exists');
        }
        // Handle foreign key constraints (garden doesn't exist)
        if (error.code === 'P2003') {
          throw new NotFoundException(`Garden with ID ${gardenId} not found`);
        }
      }

      this.logger.error(
        `Failed to register sensor: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to register sensor');
    }
  }

  /**
   * Create sensor data (receive data from sensor devices)
   */
  async createSensorData(
    createSensorDataDto: CreateSensorDataDto,
  ): Promise<SensorData> {
    const { sensorKey, value, timestamp } = createSensorDataDto;

    try {
      // Find the sensor by key
      const sensor = await this.prisma.sensor.findUnique({
        where: { sensorKey },
        include: { garden: true },
      });

      if (!sensor) {
        throw new NotFoundException(`Sensor with key ${sensorKey} not found`);
      }

      // Create the sensor data record
      const sensorData = await this.prisma.sensorData.create({
        data: {
          sensorId: sensor.id,
          gardenId: sensor.gardenId,
          value,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });

      this.logger.debug(
        `Received ${sensor.type} data: ${value} for garden ${sensor.gardenId}`,
      );
      return sensorData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to save sensor data: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to save sensor data');
    }
  }

  /**
   * Get all sensor for a specific garden
   */
  async getSensorByGarden(
    gardenerId: number,
    gardenId: number,
  ): Promise<SensorWithMetadata[]> {
    try {
      // Verify garden ownership
      const gardenOwnership = await this.gardenService.checkGardenOwnership(
        gardenerId,
        gardenId,
      );
      if (!gardenOwnership) {
        throw new ForbiddenException(
          'You do not have permission to access sensor for this garden',
        );
      }

      const sensor = await this.prisma.sensor.findMany({
        where: { gardenId },
        orderBy: { createdAt: 'desc' },
      });

      // Enhance sensor with metadata including unit
      return sensor.map((sensor) => {
        const metadata = this.metadataService.findOne(sensor.id);
        return {
          ...sensor,
          name: metadata?.name,
          description: metadata?.description,
          location: metadata?.location,
          unit: metadata?.unit,
        };
      });
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get sensor for garden ${gardenId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get sensor');
    }
  }

  /**
   * Get sensor by ID
   */
  async getSensorById(
    gardenerId: number,
    sensorId: number,
  ): Promise<SensorWithMetadata> {
    try {
      const sensor = await this.prisma.sensor.findUnique({
        where: { id: sensorId },
        include: { garden: true },
      });

      if (!sensor) {
        throw new NotFoundException(`Sensor with ID ${sensorId} not found`);
      }

      // Verify garden ownership
      const gardenOwnership = await this.gardenService.checkGardenOwnership(
        gardenerId,
        sensor.gardenId,
      );
      if (!gardenOwnership) {
        throw new ForbiddenException(
          'You do not have permission to access this sensor',
        );
      }

      // Enhance sensor with metadata including unit
      const metadata = this.metadataService.findOne(sensor.id);
      return {
        ...sensor,
        name: metadata?.name,
        description: metadata?.description,
        location: metadata?.location,
        unit: metadata?.unit,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get sensor ${sensorId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get sensor');
    }
  }

  /**
   * Update a sensor
   */
  async updateSensor(
    gardenerId: number,
    sensorId: number,
    updateSensorDto: UpdateSensorDto,
  ): Promise<SensorWithMetadata> {
    try {
      // Verify sensor exists and user has access
      const existingSensor = await this.getSensorById(gardenerId, sensorId);

      // Update the sensor type if provided
      let updatedSensor = existingSensor;
      if (
        updateSensorDto.type &&
        updateSensorDto.type !== existingSensor.type
      ) {
        updatedSensor = await this.prisma.sensor.update({
          where: { id: sensorId },
          data: { type: updateSensorDto.type },
        });
      }

      // Update metadata if provided, including unit
      const metadataUpdates = {
        name: updateSensorDto.name,
        description: updateSensorDto.description,
        location: updateSensorDto.location,
        unit: updateSensorDto.unit,
      };

      // Filter out undefined values to avoid overwriting with undefined
      const definedMetadataUpdates = Object.fromEntries(
        Object.entries(metadataUpdates).filter(([_, v]) => v !== undefined),
      );

      // Only update metadata if at least one field is provided
      if (Object.keys(definedMetadataUpdates).length > 0) {
        const metadata = this.metadataService.findOne(sensorId);
        if (metadata) {
          this.metadataService.update(sensorId, definedMetadataUpdates);
        } else if (definedMetadataUpdates.name) {
          // Create new metadata only if name is provided
          this.metadataService.create(
            sensorId,
            definedMetadataUpdates.name as string,
            definedMetadataUpdates.description as string | undefined,
            definedMetadataUpdates.location as string | undefined,
            definedMetadataUpdates.unit as string | undefined,
          );
        }
      }

      // Get updated metadata
      const updatedMetadata = this.metadataService.findOne(sensorId);

      // Return sensor with potentially updated metadata
      return {
        ...updatedSensor,
        name: updatedMetadata?.name,
        description: updatedMetadata?.description,
        location: updatedMetadata?.location,
        unit: updatedMetadata?.unit,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update sensor ${sensorId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update sensor');
    }
  }

  /**
   * Get sensor data history for a specific sensor
   */
  async getSensorDataHistory(
    gardenerId: number,
    sensorId: number,
    limit: number = 100,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SensorData[]> {
    try {
      // Verify sensor exists and user has access
      const sensor = await this.getSensorById(gardenerId, sensorId);

      // Build where clause for date range filtering
      const whereClause: Prisma.SensorDataWhereInput = { sensorId };

      if (startDate || endDate) {
        whereClause.timestamp = {};

        if (startDate) {
          whereClause.timestamp.gte = startDate;
        }

        if (endDate) {
          whereClause.timestamp.lte = endDate;
        }
      }

      return this.prisma.sensorData.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get data history for sensor ${sensorId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to get sensor data history',
      );
    }
  }

  /**
   * Get latest sensor data for each sensor in a garden
   */
  async getLatestSensorData(
    gardenerId: number,
    gardenId: number,
  ): Promise<{ sensor: SensorWithMetadata; latestData: SensorData | null }[]> {
    try {
      // Verify garden ownership
      const gardenOwnership = await this.gardenService.checkGardenOwnership(
        gardenerId,
        gardenId,
      );
      if (!gardenOwnership) {
        throw new ForbiddenException(
          'You do not have permission to access data for this garden',
        );
      }

      // Get all sensor for this garden
      const sensor = await this.prisma.sensor.findMany({
        where: { gardenId },
      });

      if (sensor.length === 0) {
        return []; // No sensor found
      }

      // For each sensor, get the latest data
      const latestDataPromises = sensor.map(async (sensor) => {
        const latestData = await this.prisma.sensorData.findFirst({
          where: { sensorId: sensor.id },
          orderBy: { timestamp: 'desc' },
        });

        // Get metadata
        const metadata = this.metadataService.findOne(sensor.id);

        return {
          sensor: {
            ...sensor,
            name: metadata?.name,
            description: metadata?.description,
            location: metadata?.location,
            unit: metadata?.unit,
          },
          latestData,
        };
      });

      return Promise.all(latestDataPromises);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get latest sensor data for garden ${gardenId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to get latest sensor data',
      );
    }
  }

  /**
   * Delete a sensor
   */
  async deleteSensor(gardenerId: number, sensorId: number): Promise<void> {
    try {
      // Verify sensor exists and user has access
      const sensor = await this.getSensorById(gardenerId, sensorId);

      // Delete the sensor (cascade delete should handle sensor data)
      await this.prisma.sensor.delete({
        where: { id: sensorId },
      });

      // Delete metadata
      this.metadataService.remove(sensorId);

      this.logger.log(`Sensor ${sensorId} deleted successfully`);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to delete sensor ${sensorId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete sensor');
    }
  }

  /**
   * Generate a unique sensor key
   */
  private generateSensorKey(type: SensorType): string {
    // Generate a unique identifier for the sensor
    const typePrefix = type.toLowerCase().slice(0, 3); // First 3 letters of type
    return `${typePrefix}_${randomUUID()}`;
  }

  /**
   * Create sensor data in bulk (receive multiple data points from sensor devices)
   */
  async createBulkSensorData(
    bulkData: { sensorKey: string; value: number; timestamp?: string }[],
    gardenKey?: string,
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const results: { successful: number; failed: number; errors: string[] } = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    // If gardenKey is provided, validate that all sensor belong to this garden
    let garden;
    if (gardenKey) {
      try {
        garden = await this.prisma.garden.findUnique({
          where: { gardenKey },
          include: { sensors: true },
        });

        if (!garden) {
          throw new NotFoundException(`Garden with key ${gardenKey} not found`);
        }

        // Get all sensor keys for this garden
        const validSensorKeys = garden.sensors.map(
          (sensor) => sensor.sensorKey,
        );

        // Validate all sensor keys belong to this garden
        const invalidSensorKeys = bulkData
          .map((item) => item.sensorKey)
          .filter((key) => !validSensorKeys.includes(key));

        if (invalidSensorKeys.length > 0) {
          throw new BadRequestException(
            `The following sensor keys do not belong to garden ${gardenKey}: ${invalidSensorKeys.join(
              ', ',
            )}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to validate garden ${gardenKey}: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }

    // Process each sensor reading
    for (const data of bulkData) {
      try {
        await this.createSensorData(data);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to process data for sensor ${data.sensorKey}: ${error.message}`,
        );
        this.logger.error(
          `Failed to process data for sensor ${data.sensorKey}: ${error.message}`,
          error.stack,
        );
      }
    }

    // Check for triggered threshold alerts
    // This would be implemented if we maintain a live database of threshold alerts
    // For now, we'll just log processing results
    this.logger.log(
      `Processed ${results.successful} sensor readings successfully, ${results.failed} failed`,
    );

    return results;
  }
}
