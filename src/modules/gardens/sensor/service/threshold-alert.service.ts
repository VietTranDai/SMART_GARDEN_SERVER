import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateThresholdAlertDto,
  ThresholdAlertDto,
  ThresholdOperator,
  UpdateThresholdAlertDto,
} from '../dto/threshold-alert.dto';
import { SensorService } from './sensor.service';

@Injectable()
export class ThresholdAlertService {
  private readonly logger = new Logger(ThresholdAlertService.name);
  private readonly alerts = new Map<number, ThresholdAlertDto>();
  private nextId = 1;

  constructor(private readonly sensorService: SensorService) {}

  /**
   * Create a new threshold alert
   */
  async createAlert(
    gardenerId: number,
    createDto: CreateThresholdAlertDto,
  ): Promise<ThresholdAlertDto> {
    try {
      // First check if the sensor exists and the user has access to it
      const sensor = await this.sensorService.getSensorById(
        gardenerId,
        createDto.sensorId,
      );

      const now = new Date();
      const alert: ThresholdAlertDto = {
        id: this.nextId++,
        ...createDto,
        gardenId: sensor.gardenId,
        sensorType: sensor.type,
        enabled: createDto.enabled !== false, // Default to true if not specified
        durationSeconds: createDto.durationSeconds || 0, // Default to 0 seconds
        createdAt: now,
        updatedAt: now,
      };

      this.alerts.set(alert.id, alert);
      this.logger.log(
        `Created threshold alert with ID ${alert.id} for sensor ${alert.sensorId}`,
      );

      return alert;
    } catch (error) {
      this.logger.error(
        `Failed to create threshold alert: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a threshold alert by ID
   */
  async getAlertById(
    gardenerId: number,
    alertId: number,
  ): Promise<ThresholdAlertDto> {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      throw new NotFoundException(
        `Threshold alert with ID ${alertId} not found`,
      );
    }

    // Verify the sensor is accessible by this gardener
    await this.sensorService.getSensorById(gardenerId, alert.sensorId);

    return alert;
  }

  /**
   * Get all threshold alerts for a specific sensor
   */
  async getAlertsBySensor(
    gardenerId: number,
    sensorId: number,
  ): Promise<ThresholdAlertDto[]> {
    // First check if the sensor exists and the user has access to it
    await this.sensorService.getSensorById(gardenerId, sensorId);

    const alerts: ThresholdAlertDto[] = [];
    for (const alert of this.alerts.values()) {
      if (alert.sensorId === sensorId) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Get all threshold alerts for a specific garden
   */
  async getAlertsByGarden(
    gardenerId: number,
    gardenId: number,
  ): Promise<ThresholdAlertDto[]> {
    // First check if the user has access to this garden
    const sensors = await this.sensorService.getSensorByGarden(
      gardenerId,
      gardenId,
    );

    if (sensors.length === 0) {
      return [];
    }

    const alerts: ThresholdAlertDto[] = [];
    for (const alert of this.alerts.values()) {
      if (alert.gardenId === gardenId) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Update a threshold alert
   */
  async updateAlert(
    gardenerId: number,
    alertId: number,
    updateDto: UpdateThresholdAlertDto,
  ): Promise<ThresholdAlertDto> {
    // First check if the alert exists and user has access
    const existingAlert = await this.getAlertById(gardenerId, alertId);

    const updatedAlert: ThresholdAlertDto = {
      ...existingAlert,
      ...updateDto,
      updatedAt: new Date(),
    };

    this.alerts.set(alertId, updatedAlert);
    this.logger.log(`Updated threshold alert with ID ${alertId}`);

    return updatedAlert;
  }

  /**
   * Delete a threshold alert
   */
  async deleteAlert(gardenerId: number, alertId: number): Promise<void> {
    // First check if the alert exists and user has access
    await this.getAlertById(gardenerId, alertId);

    const deleted = this.alerts.delete(alertId);
    if (deleted) {
      this.logger.log(`Deleted threshold alert with ID ${alertId}`);
    }
  }

  /**
   * Check if a sensor value exceeds a threshold
   */
  checkThreshold(alert: ThresholdAlertDto, value: number): boolean {
    if (!alert.enabled) {
      return false;
    }

    switch (alert.operator) {
      case ThresholdOperator.GREATER_THAN:
        return value > alert.thresholdValue;
      case ThresholdOperator.LESS_THAN:
        return value < alert.thresholdValue;
      case ThresholdOperator.GREATER_THAN_OR_EQUAL:
        return value >= alert.thresholdValue;
      case ThresholdOperator.LESS_THAN_OR_EQUAL:
        return value <= alert.thresholdValue;
      case ThresholdOperator.EQUAL:
        return value === alert.thresholdValue;
      case ThresholdOperator.NOT_EQUAL:
        return value !== alert.thresholdValue;
      default:
        return false;
    }
  }

  /**
   * Process sensor reading and check against all thresholds
   * This method would be called when new sensor data is received
   */
  async processSensorReading(
    sensorId: number,
    value: number,
    timestamp: Date,
  ): Promise<any[]> {
    const triggeredAlerts: any[] = [];

    // Find all alerts for this sensor
    for (const alert of this.alerts.values()) {
      if (alert.sensorId === sensorId && alert.enabled) {
        const isTriggered = this.checkThreshold(alert, value);

        if (isTriggered) {
          // Update the alert's last triggered time
          alert.lastTriggeredAt = timestamp;
          this.alerts.set(alert.id, alert);

          // Create an alert notification (placeholder)
          triggeredAlerts.push({
            alertId: alert.id,
            sensorId,
            value,
            threshold: alert.thresholdValue,
            operator: alert.operator,
            message: alert.message || 'Threshold exceeded',
            timestamp,
          });

          this.logger.debug(
            `Alert ${alert.id} triggered for sensor ${sensorId}: ${value} ${alert.operator} ${alert.thresholdValue}`,
          );
        }
      }
    }

    return triggeredAlerts;
  }
}
