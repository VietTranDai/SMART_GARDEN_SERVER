import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  GardenStatus,
  GardenType,
  SensorType,
  SensorUnit,
  WeatherMain,
  ActivityType,
  AlertType,
  Severity,
} from '@prisma/client';

class GardenLocationDto {
  @ApiProperty({ example: '123 Nguyễn Du', required: false })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ example: 'Phường 1', required: false })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({ example: 'Quận 1', required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ example: 'TP.HCM', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 10.762622, required: false })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiProperty({ example: 106.660172, required: false })
  @IsNumber()
  @IsOptional()
  lng?: number;
}

class GardenInfoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Vườn cà chua nhà tôi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Cà chua', required: false })
  @IsString()
  @IsOptional()
  plantName?: string;

  @ApiProperty({ example: 'Flowering', required: false })
  @IsString()
  @IsOptional()
  plantGrowStage?: string;

  @ApiProperty({ example: '2024-01-15T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  plantStartDate?: string;

  @ApiProperty({ example: 90, required: false })
  @IsInt()
  @IsOptional()
  plantDuration?: number;

  @ApiProperty({ example: 45, required: false })
  @IsInt()
  @IsOptional()
  daysFromPlanting?: number;

  @ApiProperty({ example: 45, required: false })
  @IsInt()
  @IsOptional()
  remainingDays?: number;

  @ApiProperty({ example: 50, required: false })
  @IsNumber()
  @IsOptional()
  progressPercentage?: number;

  @ApiProperty({ enum: GardenType, example: GardenType.OUTDOOR })
  @IsEnum(GardenType)
  type: GardenType;

  @ApiProperty({ enum: GardenStatus, example: GardenStatus.ACTIVE })
  @IsEnum(GardenStatus)
  status: GardenStatus;

  @ApiProperty({ type: GardenLocationDto })
  @ValidateNested()
  @Type(() => GardenLocationDto)
  location: GardenLocationDto;
}

class SensorCurrentConditionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ enum: SensorType, example: SensorType.SOIL_MOISTURE })
  @IsEnum(SensorType)
  type: SensorType;

  @ApiProperty({ example: 'Độ ẩm đất' })
  @IsString()
  name: string;

  @ApiProperty({ enum: SensorUnit, example: SensorUnit.PERCENT })
  @IsEnum(SensorUnit)
  unit: SensorUnit;

  @ApiProperty({ example: 65.5 })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ example: '2024-01-30T14:30:00Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ example: 'NORMAL' }) // Consider enum: 'NORMAL', 'WARNING', 'CRITICAL', 'OPTIMAL'
  @IsString()
  status: string;
}

class WeatherCurrentConditionDto {
  @ApiProperty({ example: 28.5 })
  @IsNumber()
  temp: number;

  @ApiProperty({ example: 75 })
  @IsInt()
  humidity: number;

  @ApiProperty({ example: 1013 })
  @IsInt()
  pressure: number;

  @ApiProperty({ enum: WeatherMain, example: WeatherMain.CLOUDS })
  @IsEnum(WeatherMain)
  weatherMain: WeatherMain;

  @ApiProperty({ example: 'Partly cloudy' })
  @IsString()
  weatherDesc: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  windSpeed: number;

  @ApiProperty({ example: '2024-01-30T14:00:00Z' })
  @IsDateString()
  observedAt: string;
}

class CurrentConditionsDto {
  @ApiProperty({ type: [SensorCurrentConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SensorCurrentConditionDto)
  sensors: SensorCurrentConditionDto[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => WeatherCurrentConditionDto)
  weather: {
    current: WeatherCurrentConditionDto;
  };
}

export class OptimalRangeDto {
  @ApiProperty({ example: 20 })
  @IsNumber()
  min: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  max: number;
}

export class PlantHealthConditionDetailDto {
  @ApiProperty({ example: 26.8 })
  @IsNumber()
  current: number;

  @ApiProperty({ type: OptimalRangeDto })
  @ValidateNested()
  @Type(() => OptimalRangeDto)
  optimal: OptimalRangeDto;

  @ApiProperty({ example: 'OPTIMAL' }) // Consider enum: 'OPTIMAL', 'LOW', 'HIGH', 'VERY_LOW', 'VERY_HIGH'
  @IsString()
  status: string;

  @ApiProperty({ example: 95 })
  @IsInt()
  score: number;
}

class PlantHealthConditionsDto {
  @ApiProperty({ type: PlantHealthConditionDetailDto, required: false })
  @ValidateNested()
  @Type(() => PlantHealthConditionDetailDto)
  @IsOptional()
  temperature?: PlantHealthConditionDetailDto;

  @ApiProperty({ type: PlantHealthConditionDetailDto, required: false })
  @ValidateNested()
  @Type(() => PlantHealthConditionDetailDto)
  @IsOptional()
  soilMoisture?: PlantHealthConditionDetailDto;

  @ApiProperty({ type: PlantHealthConditionDetailDto, required: false })
  @ValidateNested()
  @Type(() => PlantHealthConditionDetailDto)
  @IsOptional()
  humidity?: PlantHealthConditionDetailDto;

  @ApiProperty({ type: PlantHealthConditionDetailDto, required: false })
  @ValidateNested()
  @Type(() => PlantHealthConditionDetailDto)
  @IsOptional()
  soilPH?: PlantHealthConditionDetailDto;

  @ApiProperty({ type: PlantHealthConditionDetailDto, required: false })
  @ValidateNested()
  @Type(() => PlantHealthConditionDetailDto)
  @IsOptional()
  lightIntensity?: PlantHealthConditionDetailDto;
}

class PlantHealthDto {
  @ApiProperty({ example: 85 })
  @IsInt()
  overallScore: number;

  @ApiProperty({ example: 'GOOD' }) // Consider enum: 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'
  @IsString()
  healthStatus: string;

  @ApiProperty({ type: PlantHealthConditionsDto })
  @ValidateNested()
  @Type(() => PlantHealthConditionsDto)
  conditions: PlantHealthConditionsDto;
}

class DataRangeDto {
  @ApiProperty({ example: '2024-01-15T00:00:00Z' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2024-01-30T14:30:00Z' })
  @IsDateString()
  to: string;

  @ApiProperty({ example: 15 })
  @IsInt()
  totalDays: number;
}

export class SensorStatisticsDetailDto {
  @ApiProperty({ example: 25.6 })
  @IsNumber()
  average: number;

  @ApiProperty({ example: 18.2 })
  @IsNumber()
  min: number;

  @ApiProperty({ example: 32.1 })
  @IsNumber()
  max: number;

  @ApiProperty({ example: 'STABLE' }) // Consider enum: 'INCREASING', 'DECREASING', 'STABLE'
  @IsString()
  trend: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  optimalDaysCount: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  optimalPercentage: number;
}

class SensorDataStatisticsDto {
  @ApiProperty({ type: SensorStatisticsDetailDto, required: false })
  @ValidateNested()
  @Type(() => SensorStatisticsDetailDto)
  @IsOptional()
  temperature?: SensorStatisticsDetailDto;

  @ApiProperty({ type: SensorStatisticsDetailDto, required: false })
  @ValidateNested()
  @Type(() => SensorStatisticsDetailDto)
  @IsOptional()
  soilMoisture?: SensorStatisticsDetailDto;

  @ApiProperty({ type: SensorStatisticsDetailDto, required: false })
  @ValidateNested()
  @Type(() => SensorStatisticsDetailDto)
  @IsOptional()
  humidity?: SensorStatisticsDetailDto;

  @ApiProperty({ type: SensorStatisticsDetailDto, required: false })
  @ValidateNested()
  @Type(() => SensorStatisticsDetailDto)
  @IsOptional()
  soilPH?: SensorStatisticsDetailDto;

  @ApiProperty({ type: SensorStatisticsDetailDto, required: false })
  @ValidateNested()
  @Type(() => SensorStatisticsDetailDto)
  @IsOptional()
  lightIntensity?: SensorStatisticsDetailDto;
}

class ActivityEvaluationResultDto {
  @ApiProperty({ example: 4, required: false })
  @IsInt()
  @IsOptional()
  rating?: number;

  @ApiProperty({ example: 'Good', required: false })
  @IsString()
  @IsOptional()
  outcome?: string;

  @ApiProperty({ example: 'Cây hấp thụ nước tốt', required: false })
  @IsString()
  @IsOptional()
  comments?: string;
}

class RecentActivityDto {
  @ApiProperty({ example: 45 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Tưới nước buổi sáng' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ActivityType, example: ActivityType.WATERING })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiProperty({ example: '2024-01-30T07:00:00Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ example: 'Tưới 2 lít nước', required: false })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiProperty({ type: ActivityEvaluationResultDto, required: false })
  @ValidateNested()
  @Type(() => ActivityEvaluationResultDto)
  @IsOptional()
  evaluation?: ActivityEvaluationResultDto;
}

export class ActivitiesStatisticsDto {
  @ApiProperty({ example: 23 })
  @IsInt()
  totalActivities: number;

  @ApiProperty({
    example: { WATERING: 8, FERTILIZING: 3 },
    type: 'object',
    additionalProperties: { type: 'integer' },
  })
  activitiesByType: Partial<Record<ActivityType, number>>; // Use Partial as not all types may be present

  @ApiProperty({ type: [RecentActivityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecentActivityDto)
  recentActivities: RecentActivityDto[];

  @ApiProperty({ example: 75.5, required: false })
  @IsNumber()
  @IsOptional()
  successRate?: number;
}

class AverageWeatherConditionsDto {
  @ApiProperty({ example: 27.2 })
  @IsNumber()
  temperature: number;

  @ApiProperty({ example: 74 })
  @IsInt()
  humidity: number;

  @ApiProperty({ example: 0.8 }) // Assuming daily average rainfall in mm
  @IsNumber()
  rainfall: number;
}

class WeatherStatisticsDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  favorableDays: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  favorablePercentage: number;

  @ApiProperty({ type: AverageWeatherConditionsDto })
  @ValidateNested()
  @Type(() => AverageWeatherConditionsDto)
  averageConditions: AverageWeatherConditionsDto;
}

class StatisticsDto {
  @ApiProperty({ type: DataRangeDto })
  @ValidateNested()
  @Type(() => DataRangeDto)
  dataRange: DataRangeDto;

  @ApiProperty({ type: SensorDataStatisticsDto })
  @ValidateNested()
  @Type(() => SensorDataStatisticsDto)
  sensorData: SensorDataStatisticsDto;

  @ApiProperty({ type: ActivitiesStatisticsDto })
  @ValidateNested()
  @Type(() => ActivitiesStatisticsDto)
  activities: ActivitiesStatisticsDto;

  @ApiProperty({ type: WeatherStatisticsDto })
  @ValidateNested()
  @Type(() => WeatherStatisticsDto)
  weather: WeatherStatisticsDto;
}

class UpcomingTaskDto {
  @ApiProperty({ example: 67 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'WATERING' })
  @IsString() // This should ideally be an enum if you have predefined task types
  type: string;

  @ApiProperty({ example: 'Tưới nước định kỳ' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2024-01-31T07:00:00Z' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'HIGH' }) // Consider enum for priority: 'LOW', 'MEDIUM', 'HIGH'
  @IsString()
  priority: string;
}

export class TasksDto {
  @ApiProperty({ example: 18 })
  @IsInt()
  completed: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  pending: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  overdue: number;

  @ApiProperty({ example: 81.8 })
  @IsNumber()
  completionRate: number;

  @ApiProperty({ type: [UpcomingTaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpcomingTaskDto)
  upcomingTasks: UpcomingTaskDto[];

  @ApiProperty({ example: 2, required: false })
  @IsInt()
  @IsOptional()
  skipped?: number;
}

class CurrentAlertDto {
  @ApiProperty({ example: 23 })
  @IsInt()
  id: number;

  @ApiProperty({ enum: AlertType, example: AlertType.PLANT_CONDITION })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ example: 'Độ ẩm đất thấp hơn mức tối ưu' })
  @IsString()
  message: string;

  @ApiProperty({ enum: Severity, example: Severity.MEDIUM })
  @IsEnum(Severity)
  severity: Severity;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @IsDateString()
  createdAt: string;
}

export class AlertsDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  active: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  resolved: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  ignored?: number;

  @ApiProperty({ type: [CurrentAlertDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentAlertDto)
  currentAlerts: CurrentAlertDto[];

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @IsOptional()
  criticalCount?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  highCount?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  mediumCount?: number;
}

class RiskFactorDto {
  @ApiProperty({ example: 'WEATHER' }) // Consider enum: 'WEATHER', 'PEST', 'DISEASE', 'SYSTEM'
  @IsString()
  type: string;

  @ApiProperty({ example: 'Dự báo mưa lớn trong 3 ngày tới' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'MEDIUM' }) // Consider enum: 'LOW', 'MEDIUM', 'HIGH'
  @IsString()
  impact: string;

  @ApiProperty({ example: 'Che chắn hoặc tạm dừng tưới nước' })
  @IsString()
  recommendation: string;
}

class PredictionsDto {
  @ApiProperty({ example: '2024-01-31T07:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  nextWateringSchedule?: string;

  @ApiProperty({ example: '2024-04-15T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  estimatedHarvestDate?: string;

  @ApiProperty({ example: '2-3 kg', required: false })
  @IsString()
  @IsOptional()
  expectedYield?: string;

  @ApiProperty({ type: [RiskFactorDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskFactorDto)
  @IsOptional()
  riskFactors?: RiskFactorDto[];
}

export class PlantStatisticsResponseDto {
  @ApiProperty({ type: GardenInfoDto })
  @ValidateNested()
  @Type(() => GardenInfoDto)
  gardenInfo: GardenInfoDto;

  @ApiProperty({ type: CurrentConditionsDto })
  @ValidateNested()
  @Type(() => CurrentConditionsDto)
  currentConditions: CurrentConditionsDto;

  @ApiProperty({ type: PlantHealthDto })
  @ValidateNested()
  @Type(() => PlantHealthDto)
  plantHealth: PlantHealthDto;

  @ApiProperty({ type: StatisticsDto })
  @ValidateNested()
  @Type(() => StatisticsDto)
  statistics: StatisticsDto;

  @ApiProperty({ type: TasksDto })
  @ValidateNested()
  @Type(() => TasksDto)
  tasks: TasksDto;

  @ApiProperty({ type: AlertsDto })
  @ValidateNested()
  @Type(() => AlertsDto)
  alerts: AlertsDto;

  @ApiProperty({ type: PredictionsDto })
  @ValidateNested()
  @Type(() => PredictionsDto)
  predictions: PredictionsDto;
}

// This DTO might be useful if you decide to add query parameters to the endpoint later.
// For now, gardenId comes from path params.
export class GetPlantStatisticsParamsDto {
  @ApiProperty({
    description: 'ID of the garden for which to retrieve statistics',
    example: 1,
  })
  @IsInt()
  @Type(() => Number) // Ensure transformation for path/query params
  gardenId: number;
}
