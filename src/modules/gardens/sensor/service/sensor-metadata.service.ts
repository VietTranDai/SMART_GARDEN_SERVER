import { Injectable, Logger } from '@nestjs/common';
import { SensorMetadata } from '../dto/sensor-metadata.entity';
/**
 * Service for managing sensor metadata that's not stored in the database
 * This is a temporary solution until the schema can be updated
 */
@Injectable()
export class SensorMetadataService {
  private readonly logger = new Logger(SensorMetadataService.name);
  private readonly metadataMap = new Map<number, SensorMetadata>();

  /**
   * Create metadata for a sensor
   */
  create(
    sensorId: number,
    name: string,
    description?: string,
    location?: string,
    unit?: string,
  ): SensorMetadata {
    const now = new Date();
    const metadata: SensorMetadata = {
      sensorId,
      name,
      description,
      location,
      unit,
      createdAt: now,
      updatedAt: now,
    };

    this.metadataMap.set(sensorId, metadata);
    this.logger.debug(`Created metadata for sensor ${sensorId}`);
    return metadata;
  }

  /**
   * Get metadata for a sensor
   */
  findOne(sensorId: number): SensorMetadata | undefined {
    return this.metadataMap.get(sensorId);
  }

  /**
   * Update metadata for a sensor
   */
  update(
    sensorId: number,
    updates: {
      name?: string;
      description?: string;
      location?: string;
      unit?: string;
    },
  ): SensorMetadata | undefined {
    const metadata = this.metadataMap.get(sensorId);

    if (!metadata) {
      return undefined;
    }

    const definedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );

    const updatedMetadata: SensorMetadata = {
      ...metadata,
      ...definedUpdates,
      updatedAt: new Date(),
    };

    this.metadataMap.set(sensorId, updatedMetadata);
    this.logger.debug(`Updated metadata for sensor ${sensorId}`);
    return updatedMetadata;
  }

  /**
   * Delete metadata for a sensor
   */
  remove(sensorId: number): boolean {
    const deleted = this.metadataMap.delete(sensorId);
    if (deleted) {
      this.logger.debug(`Deleted metadata for sensor ${sensorId}`);
    }
    return deleted;
  }
}
