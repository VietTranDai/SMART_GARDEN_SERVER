import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ValidateNested,
  IsOptional,
  IsArray,
  IsString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GardenInfoDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  plantName: string;
  @ApiProperty()
  plantGrowStage: string;
  @ApiProperty()
  daysFromPlanting: number;
}

export class OverallAssessmentDto {
  @ApiProperty()
  healthScore: number;
  @ApiProperty({ example: 'GOOD' })
  status: string;
  @ApiProperty()
  summary: string;
}

export class ImmediateActionDto {
  @ApiProperty({ enum: ['HIGH', 'MEDIUM', 'LOW'] })
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  @ApiProperty({ example: 'WATERING' })
  category: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  description: string;
  @ApiPropertyOptional()
  suggestedAmount?: string;
  @ApiProperty()
  timeFrame: string;
  @ApiProperty()
  reason: string;
}

export class CareRecommendationDetailDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  nextSchedule?: string;
  @ApiPropertyOptional()
  frequency?: string;
  @ApiPropertyOptional()
  amount?: string;
  @ApiPropertyOptional()
  bestTime?: string;
  @ApiPropertyOptional({ type: [String] })
  tips?: string[];
  @ApiPropertyOptional()
  type?: string;
  @ApiPropertyOptional({ enum: ['HIGH', 'MEDIUM', 'LOW'] })
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  @ApiPropertyOptional({ type: [String] })
  commonPests?: string[];
  @ApiPropertyOptional({ type: [String] })
  prevention?: string[];
  @ApiPropertyOptional({ type: [String] })
  organicSolutions?: string[];
}

export class CareRecommendationsDto {
  @ApiPropertyOptional({ type: CareRecommendationDetailDto })
  watering?: CareRecommendationDetailDto;
  @ApiPropertyOptional({ type: CareRecommendationDetailDto })
  fertilizing?: CareRecommendationDetailDto;
  @ApiPropertyOptional({ type: CareRecommendationDetailDto })
  pest_control?: CareRecommendationDetailDto;
}

export class GrowthStageAdviceDto {
  @ApiProperty()
  currentStage: string;
  @ApiProperty()
  stageDescription: string;
  @ApiProperty({ type: [String] })
  keyFocus: string[];
  @ApiProperty()
  expectedDuration: string;
  @ApiProperty()
  nextStage: string;
  @ApiProperty({ type: [String] })
  preparation: string[];
}

export class EnvironmentalAdviceDetailDto {
  @ApiProperty({
    enum: ['OPTIMAL', 'GOOD', 'NEEDS_ATTENTION', 'POOR', 'UNKNOWN', 'ADEQUATE'],
  })
  status:
    | 'OPTIMAL'
    | 'GOOD'
    | 'NEEDS_ATTENTION'
    | 'POOR'
    | 'UNKNOWN'
    | 'ADEQUATE';
  @ApiPropertyOptional()
  currentRange?: string;
  @ApiPropertyOptional()
  current?: string;
  @ApiPropertyOptional()
  optimalRange?: string;
  @ApiPropertyOptional()
  optimal?: string;
  @ApiProperty()
  advice: string;
}

export class EnvironmentalAdviceDto {
  @ApiProperty({ type: EnvironmentalAdviceDetailDto, required: false })
  @ValidateNested()
  @Type(() => EnvironmentalAdviceDetailDto)
  @IsOptional()
  temperature?: EnvironmentalAdviceDetailDto;

  @ApiProperty({ type: EnvironmentalAdviceDetailDto, required: false })
  @ValidateNested()
  @Type(() => EnvironmentalAdviceDetailDto)
  @IsOptional()
  humidity?: EnvironmentalAdviceDetailDto;

  @ApiProperty({ type: EnvironmentalAdviceDetailDto, required: false })
  @ValidateNested()
  @Type(() => EnvironmentalAdviceDetailDto)
  @IsOptional()
  light?: EnvironmentalAdviceDetailDto;

  @ApiProperty({ type: EnvironmentalAdviceDetailDto, required: false })
  @ValidateNested()
  @Type(() => EnvironmentalAdviceDetailDto)
  @IsOptional()
  soilMoisture?: EnvironmentalAdviceDetailDto;

  @ApiProperty({ type: EnvironmentalAdviceDetailDto, required: false })
  @ValidateNested()
  @Type(() => EnvironmentalAdviceDetailDto)
  @IsOptional()
  soilPH?: EnvironmentalAdviceDetailDto;
}

export class WeatherForecastDto {
  @ApiProperty()
  condition: string;
  @ApiProperty()
  temperature: string;
  @ApiProperty()
  humidity: string;
  @ApiProperty()
  rainfall: string;
  @ApiProperty()
  advice: string;
}

export class DailyWeatherAdviceDto {
  @ApiProperty({ type: String, format: 'date' })
  date: string;
  @ApiProperty()
  condition: string;
  @ApiProperty()
  temperature: string;
  @ApiPropertyOptional({ example: '30%' })
  rainChance?: string;
  @ApiProperty()
  advice: string;
}

export class WeeklyTrendDto {
  @ApiProperty({
    example: '🌧️ Tuần mưa nhiều (5 ngày), Nhiệt độ trung bình: 28.5°C',
  })
  @IsString()
  summary: string;

  @ApiProperty({ type: [String], example: ['Giảm tưới nước, tăng thông gió'] })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];
}

export class WeatherConsiderationsDto {
  @ApiPropertyOptional({ type: WeatherForecastDto })
  todayForecast?: WeatherForecastDto;
  @ApiPropertyOptional({ type: [DailyWeatherAdviceDto] })
  weekAhead?: DailyWeatherAdviceDto[];

  @ApiPropertyOptional({
    description: 'Weekly weather trend summary and recommendations',
  })
  weeklyTrend?: {
    summary: string;
    recommendations: string[];
  };
}

export class SeasonalTipsDto {
  @ApiProperty()
  season: string;
  @ApiProperty({ type: [String] })
  generalAdvice: string[];
  @ApiPropertyOptional()
  monthlyFocus?: string;
}

export class CommonIssueDto {
  @ApiProperty()
  issue: string;
  @ApiProperty()
  cause: string;
  @ApiProperty()
  solution: string;
  @ApiProperty()
  prevention: string;
}

export class LearningResourceDto {
  @ApiProperty()
  title: string;
  @ApiProperty({ enum: ['VIDEO', 'ARTICLE', 'GUIDE'] })
  type: 'VIDEO' | 'ARTICLE' | 'GUIDE';
  @ApiPropertyOptional()
  duration?: string;
  @ApiPropertyOptional()
  readTime?: string;
  @ApiProperty()
  url: string;
}

export class GamificationTaskDto {
  @ApiProperty()
  task: string;
  @ApiProperty()
  xpReward: number;
  @ApiProperty()
  completed: boolean;
  @ApiPropertyOptional()
  description?: string;
}

export class GamificationAchievementDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  description: string;
  @ApiPropertyOptional()
  progress?: string;
  @ApiProperty()
  unlocked: boolean;
  @ApiPropertyOptional()
  xpReward?: number;
  @ApiPropertyOptional()
  icon?: string;
}

export class CurrentLevelDto {
  @ApiProperty()
  level: number;
  @ApiProperty()
  title: string;
  @ApiProperty()
  icon: string;
  @ApiProperty()
  description: string;
}

export class NextLevelDto {
  @ApiProperty()
  level: number;
  @ApiProperty()
  title: string;
  @ApiProperty()
  xpRequired: number;
  @ApiProperty()
  icon: string;
}

export class WeeklyProgressDayDto {
  @ApiProperty()
  day: string;
  @ApiProperty()
  activities: number;
  @ApiProperty()
  hasWatering: boolean;
  @ApiProperty()
  score: number;
}

export class GamificationDto {
  @ApiPropertyOptional({ type: [GamificationTaskDto] })
  todayTasks?: GamificationTaskDto[];
  @ApiPropertyOptional({ type: [GamificationAchievementDto] })
  achievements?: GamificationAchievementDto[];
  @ApiPropertyOptional()
  currentXP?: number;
  @ApiPropertyOptional({ type: CurrentLevelDto })
  currentLevel?: CurrentLevelDto;
  @ApiPropertyOptional({ type: NextLevelDto })
  nextLevel?: NextLevelDto;
  @ApiPropertyOptional({ type: [WeeklyProgressDayDto] })
  weeklyProgress?: WeeklyProgressDayDto[];
  @ApiPropertyOptional()
  motivationalMessage?: string;
}

export class PlantAdviceResponseDto {
  @ApiProperty({ type: GardenInfoDto })
  gardenInfo: GardenInfoDto;
  @ApiProperty({ type: OverallAssessmentDto })
  overallAssessment: OverallAssessmentDto;
  @ApiPropertyOptional({ type: [ImmediateActionDto] })
  immediateActions?: ImmediateActionDto[];
  @ApiPropertyOptional({ type: CareRecommendationsDto })
  careRecommendations?: CareRecommendationsDto;
  @ApiPropertyOptional({ type: GrowthStageAdviceDto })
  growthStageAdvice?: GrowthStageAdviceDto;
  @ApiPropertyOptional({ type: EnvironmentalAdviceDto })
  environmentalAdvice?: EnvironmentalAdviceDto;
  @ApiPropertyOptional({ type: WeatherConsiderationsDto })
  weatherConsiderations?: WeatherConsiderationsDto;
  @ApiPropertyOptional({ type: SeasonalTipsDto })
  seasonalTips?: SeasonalTipsDto;
  @ApiPropertyOptional({ type: [CommonIssueDto] })
  commonIssues?: CommonIssueDto[];
  @ApiPropertyOptional({ type: [LearningResourceDto] })
  learningResources?: LearningResourceDto[];
  @ApiPropertyOptional({ type: GamificationDto })
  gamification?: GamificationDto;
}
