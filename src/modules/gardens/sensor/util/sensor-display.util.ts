import { SensorData, SensorType, SensorUnit } from '@prisma/client';
import {
  SensorDataExtendedDto,
  TrendDataPointDto,
} from '../dto/sensor-data-extended.dto';

/**
 * Utility functions for formatting sensor data for display
 */
export class SensorDisplayUtil {
  /**
   * Get sensor status based on sensor value and type
   */
  static getSensorStatus(
    value: number,
    type: SensorType,
  ): 'normal' | 'warning' | 'critical' {
    switch (type) {
      case SensorType.TEMPERATURE:
        if (value < 10 || value > 35) return 'critical';
        if (value < 15 || value > 30) return 'warning';
        return 'normal';

      case SensorType.HUMIDITY:
      case SensorType.SOIL_MOISTURE:
        if (value < 20 || value > 90) return 'critical';
        if (value < 30 || value > 80) return 'warning';
        return 'normal';

      case SensorType.LIGHT:
        if (value < 100 || value > 10000) return 'critical';
        if (value < 500 || value > 8000) return 'warning';
        return 'normal';

      case SensorType.SOIL_PH:
        if (value < 4.5 || value > 8.5) return 'critical';
        if (value < 5.5 || value > 7.5) return 'warning';
        return 'normal';

      case SensorType.WATER_LEVEL:
        if (value < 0.1) return 'critical';
        if (value < 0.3) return 'warning';
        return 'normal';

      default:
        return 'normal';
    }
  }

  /**
   * Get the display name for a sensor type
   */
  static getSensorTypeName(type: SensorType): string {
    switch (type) {
      case SensorType.TEMPERATURE:
        return 'Nhiệt độ';
      case SensorType.HUMIDITY:
        return 'Độ ẩm không khí';
      case SensorType.SOIL_MOISTURE:
        return 'Độ ẩm đất';
      case SensorType.LIGHT:
        return 'Ánh sáng';
      case SensorType.SOIL_PH:
        return 'Độ pH';
      case SensorType.WATER_LEVEL:
        return 'Mực nước';
      default:
        return 'Cảm biến';
    }
  }

  /**
   * Get the display text for a sensor unit
   */
  static getSensorUnitText(unit: SensorUnit): string {
    switch (unit) {
      case SensorUnit.CELSIUS:
        return '°C';
      case SensorUnit.PERCENT:
        return '%';
      case SensorUnit.LUX:
        return 'lux';
      case SensorUnit.PH:
        return 'pH';
      case SensorUnit.LITER:
        return 'L';
      default:
        return '';
    }
  }

  /**
   * Get the appropriate unit for a sensor type
   */
  static getSensorUnitForType(type: SensorType): SensorUnit {
    switch (type) {
      case SensorType.TEMPERATURE:
        return SensorUnit.CELSIUS;
      case SensorType.HUMIDITY:
      case SensorType.SOIL_MOISTURE:
        return SensorUnit.PERCENT;
      case SensorType.LIGHT:
        return SensorUnit.LUX;
      case SensorType.SOIL_PH:
        return SensorUnit.PH;
      case SensorType.WATER_LEVEL:
        return SensorUnit.LITER;
      default:
        throw new Error(`Unknown sensor type: ${type}`);
    }
  }

  /**
   * Generate dummy trend data for testing
   */
  static generateDummyTrendData(value: number): TrendDataPointDto[] {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const time = new Date(now);
      time.setHours(time.getHours() - (5 - i));
      return {
        value: value - 2 + Math.random() * 4,
        timestamp: time.toISOString(),
      };
    });
  }

  /**
   * Format sensor data for display
   */
  static formatSensorDataForDisplay(
    sensorData: Record<SensorType, SensorData[]>,
  ): Record<string, SensorDataExtendedDto[]> {
    const result: Record<string, SensorDataExtendedDto[]> = {};

    Object.entries(sensorData).forEach(([type, dataArray]) => {
      const typeCasted = type as SensorType;
      result[type] = dataArray.map((data) => ({
        ...data,
        type: typeCasted,
        name: this.getSensorTypeName(typeCasted),
        unit: this.getSensorUnitText(this.getSensorUnitForType(typeCasted)),
        lastUpdated: data.timestamp,
        gardenId: data.sensorId, // This would need to be populated properly with actual garden ID
        isActive: true,
        trendData: this.generateDummyTrendData(data.value),
      }));
    });

    return result;
  }
}
