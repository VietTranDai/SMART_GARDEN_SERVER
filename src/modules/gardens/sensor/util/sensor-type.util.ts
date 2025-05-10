import { SensorType, SensorUnit } from '@prisma/client';

/**
 * Utility for managing sensor type and unit conversions between backend and frontend
 */
export class SensorTypeUtil {
  /**
   * Map the frontend sensor type to backend enum
   */
  static mapFrontendTypeToBackend(frontendType: string): SensorType {
    switch (frontendType.toUpperCase()) {
      case 'TEMPERATURE':
        return SensorType.TEMPERATURE;
      case 'HUMIDITY':
        return SensorType.HUMIDITY;
      case 'SOIL_MOISTURE':
        return SensorType.SOIL_MOISTURE;
      case 'LIGHT':
        return SensorType.LIGHT;
      case 'SOIL_PH':
        return SensorType.SOIL_PH;
      case 'WATER_LEVEL':
        return SensorType.WATER_LEVEL;
      default:
        throw new Error(`Unknown sensor type: ${frontendType}`);
    }
  }

  /**
   * Map the backend sensor type to frontend string
   */
  static mapBackendTypeToFrontend(backendType: SensorType): string {
    return backendType.toString();
  }

  /**
   * Map the frontend sensor unit to backend enum
   */
  static mapFrontendUnitToBackend(frontendUnit: string): SensorUnit {
    switch (frontendUnit.toUpperCase()) {
      case 'CELSIUS':
        return SensorUnit.CELSIUS;
      case 'PERCENT':
        return SensorUnit.PERCENT;
      case 'LUX':
        return SensorUnit.LUX;
      case 'PH':
        return SensorUnit.PH;
      case 'LITER':
        return SensorUnit.LITER;
      default:
        throw new Error(`Unknown sensor unit: ${frontendUnit}`);
    }
  }

  /**
   * Map the backend sensor unit to frontend string
   */
  static mapBackendUnitToFrontend(backendUnit: SensorUnit): string {
    return backendUnit.toString();
  }

  /**
   * Get the appropriate unit for a sensor type
   */
  static getUnitForType(type: SensorType): SensorUnit {
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
}
