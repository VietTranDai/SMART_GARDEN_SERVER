import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ActivityType,
  EvaluatorType,
  GardenActivity,
  ActivityEvaluation,
  Gardener,
  User,
  Garden,
  WeatherObservation,
  PhotoEvaluation,
  WateringSchedule,
} from '@prisma/client';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsBoolean,
  Min,
  Max,
  IsArray,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ====================== ENUMS ======================

export enum ActivityEffectiveness {
  HIGHLY_EFFECTIVE = 'HIGHLY_EFFECTIVE',
  EFFECTIVE = 'EFFECTIVE',
  MODERATELY_EFFECTIVE = 'MODERATELY_EFFECTIVE',
  INEFFECTIVE = 'INEFFECTIVE',
  HARMFUL = 'HARMFUL',
  UNKNOWN = 'UNKNOWN',
}

export enum TrendDirection {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DECLINING = 'DECLINING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN',
}

export enum PredictionConfidence {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW',
}

export enum ActivityTiming {
  OPTIMAL = 'OPTIMAL',
  GOOD = 'GOOD',
  ACCEPTABLE = 'ACCEPTABLE',
  POOR = 'POOR',
  INAPPROPRIATE = 'INAPPROPRIATE',
}

export enum ActivityDifficulty {
  VERY_EASY = 'VERY_EASY',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  VERY_HARD = 'VERY_HARD',
}

export enum UserSkillLevel {
  BEGINNER = 'BEGINNER',
  NOVICE = 'NOVICE',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

// ====================== BASIC DTO ======================

export class GardenActivityDto {
  @ApiProperty({ description: 'ID hoạt động', example: 10 })
  id: number;

  @ApiProperty({ description: 'ID vườn', example: 1 })
  gardenId: number;

  @ApiProperty({ description: 'ID gardener', example: 5 })
  gardenerId: number;

  @ApiProperty({ description: 'Tên hoạt động' })
  name: string;

  @ApiProperty({ description: 'Loại hoạt động', enum: ActivityType })
  activityType: ActivityType;

  @ApiProperty({
    description: 'Thời gian thực hiện',
    type: String,
    format: 'date-time',
  })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Tên cây' })
  plantName?: string;

  @ApiPropertyOptional({ description: 'Giai đoạn cây' })
  plantGrowStage?: string;

  @ApiPropertyOptional({ description: 'Chi tiết humidity (%)' })
  humidity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết temperature (°C)' })
  temperature?: number;

  @ApiPropertyOptional({ description: 'Chi tiết light intensity' })
  lightIntensity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết water level' })
  waterLevel?: number;

  @ApiPropertyOptional({ description: 'Chi tiết rainfall' })
  rainfall?: number;

  @ApiPropertyOptional({ description: 'Chi tiết soil moisture' })
  soilMoisture?: number;

  @ApiPropertyOptional({ description: 'Chi tiết soil pH' })
  soilPH?: number;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  details?: string;

  @ApiPropertyOptional({ description: 'Lý do thực hiện' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Ghi chú' })
  notes?: string;

  @ApiProperty({
    description: 'Thời gian tạo',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}

// ====================== QUERY DTO ======================

export class GetGardenActivitiesQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo ID khu vườn',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'Garden ID phải là một số nguyên.' })
  @Min(1, { message: 'Garden ID phải lớn hơn hoặc bằng 1.' })
  gardenId?: number;

  @ApiPropertyOptional({
    description: 'Lọc theo loại hoạt động',
    enum: ActivityType,
  })
  @IsOptional()
  @IsEnum(ActivityType, { message: 'Loại hoạt động không hợp lệ.' })
  type?: ActivityType;

  @ApiPropertyOptional({
    description: 'Lọc hoạt động từ ngày (ISO 8601 string)',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ngày bắt đầu phải là một chuỗi ngày tháng hợp lệ (ISO 8601).' },
  )
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Lọc hoạt động đến ngày (ISO 8601 string)',
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Ngày kết thúc phải là một chuỗi ngày tháng hợp lệ (ISO 8601).',
    },
  )
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Số trang (mặc định là 1)',
    type: Number,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt({ message: 'Số trang phải là số nguyên.' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1.' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Số lượng mục trên mỗi trang (mặc định là 10)',
    type: Number,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  @IsInt({ message: 'Số lượng mục phải là số nguyên.' })
  @Min(1, { message: 'Số lượng mục tối thiểu là 1.' })
  @Max(100, { message: 'Số lượng mục tối đa là 100.' })
  limit?: number;

  // Fields for analytics (can be extended)
  @ApiPropertyOptional({
    description: 'Phân tích theo người dùng cụ thể (ID)',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: 'User ID phân tích phải là số nguyên.' })
  analyzeByUserId?: number;

  @ApiPropertyOptional({
    description:
      'Khoảng thời gian phân tích (ví dụ: last7days, last30days, customRange)',
    type: String,
  })
  @IsOptional()
  @IsString()
  analysisPeriod?: string;
}

// ====================== PAGINATION DTOs ======================

export class PaginationMetaDto {
  @ApiProperty({ description: 'Tổng số mục' })
  totalItems: number;

  @ApiProperty({ description: 'Số mục trên mỗi trang' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  currentPage: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
}

export class PaginatedGardenActivitiesResultDto {
  @ApiProperty({
    type: [GardenActivityDto],
    description: 'Danh sách hoạt động',
  })
  items: GardenActivityDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Thông tin phân trang' })
  meta: PaginationMetaDto;
}

// ====================== DETAILED ANALYTICS DTO ======================

export class DetailedGardenActivityAnalyticsDto {
  @ApiProperty({ description: 'ID hoạt động', example: 10 })
  id: number;

  @ApiProperty({ description: 'ID vườn', example: 1 })
  gardenId: number;

  @ApiProperty({ description: 'ID gardener', example: 5 })
  gardenerId: number;

  @ApiProperty({ description: 'Tên hoạt động' })
  name: string;

  @ApiProperty({ description: 'Loại hoạt động', enum: ActivityType })
  activityType: ActivityType;

  @ApiProperty({
    description: 'Thời gian thực hiện',
    type: String,
    format: 'date-time',
  })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Tên cây' })
  plantName?: string;

  @ApiPropertyOptional({ description: 'Giai đoạn cây' })
  plantGrowStage?: string;

  @ApiPropertyOptional({ description: 'Chi tiết humidity (%)' })
  humidity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết temperature (°C)' })
  temperature?: number;

  @ApiPropertyOptional({ description: 'Chi tiết light intensity' })
  lightIntensity?: number;

  @ApiPropertyOptional({ description: 'Chi tiết water level' })
  waterLevel?: number;

  @ApiPropertyOptional({ description: 'Chi tiết rainfall' })
  rainfall?: number;

  @ApiPropertyOptional({ description: 'Chi tiết soil moisture' })
  soilMoisture?: number;

  @ApiPropertyOptional({ description: 'Chi tiết soil pH' })
  soilPH?: number;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  details?: string;

  @ApiPropertyOptional({ description: 'Lý do thực hiện' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Ghi chú' })
  notes?: string;

  // ====================== ACTIVITY EXECUTION DETAILS ======================

  @ApiProperty({ description: 'Chi tiết thực hiện hoạt động' })
  executionDetails: {
    // Thời gian thực hiện
    startTime?: Date;
    endTime?: Date;
    actualDuration: number; // phút
    plannedDuration?: number; // phút
    durationEfficiency: number; // % (actual/planned * 100)

    // Phương pháp và công cụ
    method: string; // cách thức thực hiện (tay, công cụ, tự động)
    toolsUsed: string[]; // danh sách công cụ sử dụng
    materialsUsed: string[]; // vật liệu sử dụng

    // Khối lượng công việc
    workload: {
      area?: number; // diện tích thực hiện (m2)
      quantity?: number; // số lượng (cây, lít nước, gram phân bón)
      unit?: string; // đơn vị
      intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'INTENSIVE'; // cường độ công việc
    };

    // Kết quả tức thì
    immediateResults: {
      completed: boolean;
      completionRate: number; // % hoàn thành
      qualityRating: number; // 1-5 chất lượng thực hiện
      satisfactionLevel: number; // 1-5 mức độ hài lòng
      issuesEncountered: string[]; // vấn đề gặp phải
      solutionsApplied: string[]; // giải pháp áp dụng
    };

    // Điều kiện thực hiện
    executionConditions: {
      weatherSuitability:
        | 'PERFECT'
        | 'GOOD'
        | 'ACCEPTABLE'
        | 'POOR'
        | 'UNSUITABLE';
      userEnergyLevel: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
      availableTime: number; // phút có sẵn
      urgencyLevel: 'ROUTINE' | 'PLANNED' | 'URGENT' | 'EMERGENCY';
      difficultyLevel: ActivityDifficulty;
    };
  };

  // ====================== USER PERFORMANCE ANALYSIS ======================

  @ApiProperty({ description: 'Phân tích hiệu suất người dùng' })
  userPerformance: {
    // Kỹ năng và kinh nghiệm
    skillAssessment: {
      currentSkillLevel: UserSkillLevel;
      activityExpertise: number; // 0-100 độ thành thạo với loại hoạt động này
      improvementRate: number; // % cải thiện so với hoạt động trước
      learningProgress: {
        mistakesMade: string[];
        lessonsLearned: string[];
        skillsImproved: string[];
        nextSkillToLearn: string;
      };
    };

    // Hiệu quả làm việc
    workEfficiency: {
      speedRating: number; // 1-5 tốc độ làm việc
      accuracyRating: number; // 1-5 độ chính xác
      consistencyRating: number; // 1-5 tính nhất quán
      innovationRating: number; // 1-5 tính sáng tạo trong cách làm

      // So sánh với lần trước
      speedImprovement: number; // % thay đổi tốc độ
      accuracyImprovement: number; // % thay đổi độ chính xác
      overallImprovement: number; // % cải thiện tổng thể
    };

    // Thói quen làm việc
    workingHabits: {
      preferredTimeOfDay: string; // buổi sáng, chiều, tối
      preferredWeather: string[]; // thời tiết yêu thích
      workingStyle: 'SYSTEMATIC' | 'FLEXIBLE' | 'SPONTANEOUS' | 'PERFECTIONIST';
      planningTendency: 'VERY_PLANNED' | 'PLANNED' | 'MODERATE' | 'SPONTANEOUS';

      // Patterns
      commonMistakes: string[];
      strengthAreas: string[];
      improvementAreas: string[];
      personalBestPractices: string[];
    };

    // Động lực và thái độ
    motivation: {
      motivationLevel: number; // 1-10
      enjoymentLevel: number; // 1-10
      confidenceLevel: number; // 1-10
      stressLevel: number; // 1-10

      motivationFactors: string[]; // yếu tố tạo động lực
      demotivationFactors: string[]; // yếu tố giảm động lực
      rewardPreferences: string[]; // loại phần thưởng ưa thích
    };
  };

  // ====================== ACTIVITY FREQUENCY & PATTERNS ======================

  @ApiProperty({ description: 'Phân tích tần suất và mẫu hoạt động' })
  activityPatterns: {
    // Tần suất thực hiện
    frequency: {
      dailyFrequency: number; // lần/ngày trung bình
      weeklyFrequency: number; // lần/tuần
      monthlyFrequency: number; // lần/tháng
      yearlyFrequency: number; // lần/năm dự kiến

      // Khoảng cách thời gian
      daysSinceLastSameActivity?: number;
      averageIntervalDays: number; // khoảng cách trung bình
      shortestInterval: number; // khoảng cách ngắn nhất
      longestInterval: number; // khoảng cách dài nhất

      // Đánh giá tần suất
      frequencyRating:
        | 'TOO_FREQUENT'
        | 'OPTIMAL'
        | 'INSUFFICIENT'
        | 'RARE'
        | 'OVERDUE';
      recommendedFrequency: number; // tần suất khuyến nghị (ngày)
      nextRecommendedDate: Date;
    };

    // Mẫu thời gian
    temporalPatterns: {
      // Mẫu trong ngày
      dailyPattern: {
        preferredHours: number[]; // giờ thường làm
        peakPerformanceHours: number[]; // giờ hiệu suất cao nhất
        avoidedHours: number[]; // giờ tránh làm
        timeDistribution: { [hour: number]: number }; // phân bố theo giờ
      };

      // Mẫu trong tuần
      weeklyPattern: {
        preferredDays: number[]; // 0=CN, 1=T2...
        peakPerformanceDays: number[];
        avoidedDays: number[];
        weekendVsWeekday: 'WEEKEND_PREFER' | 'WEEKDAY_PREFER' | 'NO_PREFERENCE';
        dayDistribution: { [day: number]: number };
      };

      // Mẫu theo mùa
      seasonalPattern: {
        springFrequency: number;
        summerFrequency: number;
        autumnFrequency: number;
        winterFrequency: number;
        mostActiveSeasons: string[];
        seasonalEffectiveness: { [season: string]: number };
      };

      // Mẫu thời tiết
      weatherPattern: {
        preferredWeatherConditions: string[];
        avoidedWeatherConditions: string[];
        weatherImpactOnPerformance: { [condition: string]: number };
        rainImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        temperatureOptimalRange: { min: number; max: number };
      };
    };

    // Mẫu tuần tự hoạt động
    sequencePatterns: {
      commonPreceedingActivities: ActivityType[]; // hoạt động thường làm trước
      commonFollowingActivities: ActivityType[]; // hoạt động thường làm sau
      activityChains: {
        // chuỗi hoạt động thường xuyên
        sequence: ActivityType[];
        frequency: number;
        effectiveness: number;
      }[];

      // Combo hoạt động hiệu quả
      effectiveCombinations: {
        activities: ActivityType[];
        synergy: number; // 0-100 độ hiệp lực
        timeGap: number; // khoảng cách thời gian lý tưởng (giờ)
        successRate: number;
      }[];
    };
  };

  // ====================== EFFECTIVENESS & OUTCOMES ======================

  @ApiProperty({ description: 'Phân tích hiệu quả và kết quả' })
  effectivenessAnalysis: {
    // Hiệu quả tức thì
    immediateEffectiveness: {
      taskCompletionRate: number; // % hoàn thành nhiệm vụ
      qualityScore: number; // 0-100 chất lượng
      timeEfficiency: number; // 0-100 hiệu suất thời gian
      resourceEfficiency: number; // 0-100 hiệu suất tài nguyên
      overallEffectiveness: ActivityEffectiveness;
    };

    // Hiệu quả dài hạn
    longTermEffectiveness: {
      plantHealthImpact: number; // -100 to 100
      growthImpact: number; // -100 to 100
      yieldImpact: number; // % ảnh hưởng đến năng suất
      sustainabilityImpact: number; // -100 to 100
      cumulativeEffect: number; // hiệu ứng tích lũy
    };

    // Đánh giá từ nhiều nguồn
    evaluationSummary: {
      totalEvaluations: number;
      userEvaluations: number;
      systemEvaluations: number;
      communityEvaluations: number;
      expertEvaluations: number;

      // Điểm số trung bình từ các nguồn
      averageUserRating: number;
      averageSystemRating: number;
      averageCommunityRating: number;
      averageExpertRating: number;
      weightedAverageRating: number;

      // Consensus
      ratingConsensus: 'HIGH' | 'MEDIUM' | 'LOW'; // độ đồng thuận
      controversialAspects: string[]; // khía cạnh gây tranh cãi
    };

    // Kết quả đạt được
    outcomes: {
      plannedOutcomes: string[]; // kết quả dự kiến
      actualOutcomes: string[]; // kết quả thực tế
      unexpectedOutcomes: string[]; // kết quả bất ngờ
      missedOpportunities: string[]; // cơ hội bỏ lỡ

      // Success metrics
      successRate: number; // % thành công
      failureReasons: string[]; // lý do thất bại
      partialSuccessAreas: string[]; // khu vực thành công một phần

      // Value generated
      economicValue: number; // giá trị kinh tế (VND)
      timeValueSaved: number; // thời gian tiết kiệm (phút)
      learningValue: string[]; // giá trị học hỏi
      satisfactionValue: number; // giá trị hài lòng (1-10)
    };
  };

  // ====================== LEARNING & IMPROVEMENT ======================

  @ApiProperty({ description: 'Phân tích học hỏi và cải thiện' })
  learningAnalysis: {
    // Kinh nghiệm thu được
    experienceGained: {
      xpEarned: number;
      xpSourceBreakdown: { [source: string]: number };
      bonusXpReasons: string[];
      xpMultiplier: number;

      // Cấp độ và tiến bộ
      levelBefore: number;
      levelAfter: number;
      isLevelUp: boolean;
      progressInCurrentLevel: number; // %
      pointsToNextLevel: number;
      estimatedTimeToNextLevel: number; // ngày
    };

    // Kỹ năng phát triển
    skillDevelopment: {
      skillsImproved: {
        skillName: string;
        previousLevel: number;
        newLevel: number;
        improvement: number;
        evidenceOfImprovement: string[];
      }[];

      newSkillsAcquired: string[];
      expertiseLevelChange: number; // thay đổi độ thành thạo

      // Skill gaps identified
      skillGapsIdentified: string[];
      recommendedLearningPath: string[];
      difficultyAreasToWork: string[];
    };

    // Mistakes và Lessons
    mistakesAndLessons: {
      mistakesMade: {
        mistake: string;
        severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
        impact: string;
        lesson: string;
        preventionStrategy: string;
      }[];

      lessonsLearned: {
        lesson: string;
        source: 'EXPERIENCE' | 'OBSERVATION' | 'FEEDBACK' | 'RESEARCH';
        applicability: string[];
        importance: number; // 1-10
      }[];

      bestPracticesDiscovered: string[];
      innovativeApproaches: string[];
    };

    // Cải thiện được khuyến nghị
    improvementRecommendations: {
      immediateTips: string[]; // mẹo cải thiện ngay lập tức
      shortTermGoals: string[]; // mục tiêu ngắn hạn (1-4 tuần)
      longTermGoals: string[]; // mục tiêu dài hạn (3-12 tháng)

      trainingNeeds: string[]; // nhu cầu đào tạo
      resourceNeeds: string[]; // nhu cầu tài nguyên
      mentorshipNeeds: string[]; // nhu cầu hướng dẫn

      prioritizedImprovements: {
        improvement: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        effort: 'LOW' | 'MEDIUM' | 'HIGH';
        impact: 'LOW' | 'MEDIUM' | 'HIGH';
        timeframe: string;
      }[];
    };
  };

  // ====================== COMPARISON & BENCHMARKING ======================

  @ApiProperty({ description: 'So sánh và benchmarking' })
  comparisonAnalysis: {
    // So sánh với bản thân
    selfComparison: {
      // So với lần trước
      vsLastTime: {
        performanceChange: number; // % thay đổi
        timeChange: number; // thay đổi thời gian
        qualityChange: number; // thay đổi chất lượng
        efficiencyChange: number; // thay đổi hiệu suất
        overallTrend: TrendDirection;
      };

      // So với trung bình cá nhân
      vsPersonalAverage: {
        performanceVsAverage: number; // % so với TB cá nhân
        aboveAverageAspects: string[];
        belowAverageAspects: string[];
        personalBest: boolean;
        personalRecord: string;
      };

      // Tiến bộ theo thời gian
      progressOverTime: {
        last7Days: TrendDirection;
        last30Days: TrendDirection;
        last90Days: TrendDirection;
        last365Days: TrendDirection;
        overallCareerTrend: TrendDirection;
      };
    };

    // So sánh với cộng đồng
    communityComparison: {
      // Thứ hạng
      ranking: {
        globalRank: number;
        totalUsers: number;
        percentile: number;
        categoryRank: number; // trong cùng loại hoạt động
        levelRank: number; // trong cùng level
        regionRank: number; // trong cùng khu vực
      };

      // So sánh metrics
      communityBenchmarks: {
        averageRating: number;
        averageTime: number;
        averageFrequency: number;
        averageEffectiveness: number;

        top10Percent: {
          averageRating: number;
          averageTime: number;
          commonTechniques: string[];
          successFactors: string[];
        };

        performanceGap: {
          ratingGap: number;
          timeGap: number;
          efficiencyGap: number;
          skillGap: string[];
        };
      };

      // Học hỏi từ người khác
      learningOpportunities: {
        topPerformers: {
          username: string;
          performance: number;
          specialties: string[];
          publicTips: string[];
        }[];

        similarUsers: {
          username: string;
          similarity: number; // % tương đồng
          strengths: string[];
          collaborationOpportunities: string[];
        }[];

        mentorshipOpportunities: {
          potentialMentors: string[];
          expertiseAreas: string[];
          availabilityStatus: string;
        };
      };
    };

    // So sánh với tiêu chuẩn ngành
    industryBenchmarks: {
      professionalStandards: {
        timeStandard: number;
        qualityStandard: number;
        frequencyStandard: number;
        vsStandardPerformance: number; // % so với chuẩn
      };

      bestPractices: {
        industryBestPractices: string[];
        adoptedPractices: string[];
        gapAnalysis: string[];
        implementationPlan: string[];
      };
    };
  };

  // ====================== PREDICTIONS & RECOMMENDATIONS ======================

  @ApiProperty({ description: 'Dự đoán và khuyến nghị' })
  predictionsAndRecommendations: {
    // Dự đoán hoạt động tiếp theo
    nextActivityPredictions: {
      // Dự đoán loại hoạt động
      predictedNextActivities: {
        activityType: ActivityType;
        probability: number; // 0-1
        recommendedDate: Date;
        reasoning: string[];
        confidence: PredictionConfidence;
      }[];

      // Dự đoán thời điểm optimal
      optimalTimingPrediction: {
        nextOptimalDate: Date;
        optimalTimeOfDay: number; // giờ
        optimalWeatherConditions: string[];
        confidenceLevel: PredictionConfidence;
        factors: string[];
      };

      // Dự đoán kết quả
      outcomesPrediction: {
        expectedSuccessRate: number;
        predictedQuality: number;
        predictedEfficiency: number;
        riskFactors: string[];
        successFactors: string[];
      };
    };

    // Khuyến nghị cải thiện
    improvementRecommendations: {
      // Khuyến nghị ngay lập tức
      immediateActions: {
        action: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        expectedImpact: 'HIGH' | 'MEDIUM' | 'LOW';
        timeToImplement: number; // phút
      }[];

      // Khuyến nghị dài hạn
      strategicRecommendations: {
        goal: string;
        timeframe: string;
        steps: string[];
        resources: string[];
        successMetrics: string[];
        difficulty: ActivityDifficulty;
      }[];

      // Khuyến nghị học tập
      learningRecommendations: {
        skillToLearn: string;
        learningMethod: string[];
        timeCommitment: string;
        expectedBenefit: string;
        priority: number; // 1-10
      }[];
    };

    // Cảnh báo và rủi ro
    warningsAndRisks: {
      // Cảnh báo hiện tại
      currentWarnings: {
        warning: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        actionRequired: string;
        deadline?: Date;
      }[];

      // Rủi ro tiềm ẩn
      potentialRisks: {
        risk: string;
        probability: number; // 0-1
        impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
        prevention: string[];
        mitigation: string[];
      }[];

      // Cơ hội bỏ lỡ
      missedOpportunities: {
        opportunity: string;
        timeWindow: string;
        benefit: string;
        actionNeeded: string;
      }[];
    };

    // Mục tiêu được đề xuất
    suggestedGoals: {
      // Mục tiêu ngắn hạn (1-4 tuần)
      shortTermGoals: {
        goal: string;
        deadline: Date;
        measurableOutcome: string;
        actionPlan: string[];
        difficulty: ActivityDifficulty;
        motivation: string;
      }[];

      // Mục tiêu dài hạn (3-12 tháng)
      longTermGoals: {
        goal: string;
        timeframe: string;
        milestones: string[];
        resourceRequirements: string[];
        successCriteria: string[];
        strategicImportance: number; // 1-10
      }[];

      // Thử thách cá nhân
      personalChallenges: {
        challenge: string;
        difficulty: ActivityDifficulty;
        reward: string;
        timeLimit: string;
        rules: string[];
      }[];
    };
  };

  // ====================== BASIC FIELDS ======================

  @ApiProperty({ description: 'Thông tin người làm vườn' })
  gardener: {
    userId: number;
    experiencePoints: number;
    experienceLevelId: number;
    user: {
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
    experienceLevel: {
      level: number;
      title: string;
      description: string;
      icon: string;
    };
  };

  @ApiProperty({ description: 'Thông tin vườn' })
  garden: {
    name: string;
    type: string;
    status: string;
    plantName?: string;
    plantGrowStage?: string;
    city?: string;
    district?: string;
    ward?: string;
  };

  @ApiPropertyOptional({ description: 'Dữ liệu thời tiết' })
  weatherObservation?: {
    temp: number;
    feelsLike: number;
    pressure: number;
    humidity: number;
    clouds: number;
    visibility: number;
    windSpeed: number;
    windDeg: number;
    windGust?: number;
    rain1h?: number;
    snow1h?: number;
    weatherMain: string;
    weatherDesc: string;
    iconCode: string;
  };

  @ApiProperty({ description: 'Danh sách đánh giá', type: [Object] })
  evaluations: Array<{
    id: number;
    evaluatorType: EvaluatorType;
    gardenerId?: number;
    evaluatedAt: Date;
    outcome?: string;
    rating?: number;
    metrics?: any;
    comments?: string;
    evaluator?: {
      firstName: string;
      lastName: string;
      username: string;
    };
  }>;

  @ApiProperty({ description: 'Ảnh đánh giá', type: [Object] })
  photoEvaluations: Array<{
    id: number;
    photoUrl: string;
    aiFeedback?: string;
    confidence?: number;
    notes?: string;
    evaluatedAt?: Date;
    plantName?: string;
    plantGrowStage?: string;
  }>;

  @ApiProperty({ description: 'Lịch tưới nước', type: [Object] })
  wateringSchedules: Array<{
    id: number;
    scheduledAt: Date;
    amount?: number;
    status: string;
    notes?: string;
  }>;

  @ApiProperty({
    description: 'Thời gian tạo',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}

// ====================== SUMMARY ANALYTICS DTO (NEW) ======================

export class GardenActivitySummaryAnalyticsDto {
  @ApiProperty({
    description: 'ID của bản phân tích tổng hợp',
    example: 'summary-12345',
  })
  analysisId: string;

  @ApiProperty({
    description: 'Tóm tắt phân tích tổng hợp',
    example: 'Phân tích 50 hoạt động tưới cây trong tháng qua.',
  })
  summary: string;

  @ApiProperty({ description: 'Dữ liệu phân tích tổng hợp' })
  data: {
    totalActivities: number;
    activityTypesFound: ActivityType[];
    countByActivityType: Record<ActivityType, number>;
    dateRange?: { from?: string; to?: string };
    filtersApplied: Partial<GetGardenActivitiesQueryDto>;
    // Add more aggregated/summary fields as needed
  };

  @ApiProperty({
    description: 'Thời gian tạo phân tích',
    type: String,
    format: 'date-time',
  })
  analyzedAt: Date;
}

// ====================== MAPPING FUNCTIONS ======================

export function mapToGardenActivityDto(
  activity: GardenActivity,
): GardenActivityDto {
  return {
    id: activity.id,
    gardenId: activity.gardenId,
    gardenerId: activity.gardenerId,
    name: activity.name,
    activityType: activity.activityType,
    timestamp: activity.timestamp,
    plantName: activity.plantName || undefined,
    plantGrowStage: activity.plantGrowStage || undefined,
    humidity: activity.humidity || undefined,
    temperature: activity.temperature || undefined,
    lightIntensity: activity.lightIntensity || undefined,
    waterLevel: activity.waterLevel || undefined,
    rainfall: activity.rainfall || undefined,
    soilMoisture: activity.soilMoisture || undefined,
    soilPH: activity.soilPH || undefined,
    details: activity.details || undefined,
    reason: activity.reason || undefined,
    notes: activity.notes || undefined,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}

export function mapToGardenActivityDtoList(
  activities: GardenActivity[],
): GardenActivityDto[] {
  return activities.map(mapToGardenActivityDto);
}

export function mapToDetailedGardenActivityAnalyticsDto(
  activity: GardenActivity & {
    gardener: Gardener & {
      user: User;
      experienceLevel: any;
    };
    garden: Garden;
    weatherObservation?: WeatherObservation;
    evaluations: (ActivityEvaluation & {
      gardener?: {
        user: {
          firstName: string;
          lastName: string;
          username: string;
        };
      };
    })[];
    photoEvaluations: PhotoEvaluation[];
    wateringSchedule: WateringSchedule[];
  },
  additionalAnalytics?: {
    userPerformanceData?: any;
    communityData?: any;
    historicalData?: any;
    predictionData?: any;
  },
): DetailedGardenActivityAnalyticsDto {
  // Tính toán execution details
  const executionDetails = {
    actualDuration: 30, // Mock: 30 phút
    durationEfficiency: 95, // Mock: 95% hiệu suất
    method: 'manual', // Mặc định thủ công
    toolsUsed: ['watering_can', 'garden_gloves'], // Mock tools
    materialsUsed: ['water', 'fertilizer'], // Mock materials

    workload: {
      area: 2.5, // m2
      quantity: 5, // lít nước
      unit: 'liters',
      intensity: 'MEDIUM' as const,
    },

    immediateResults: {
      completed: true,
      completionRate: 100,
      qualityRating: 4,
      satisfactionLevel: 4,
      issuesEncountered: [],
      solutionsApplied: ['adjusted_water_amount'],
    },

    executionConditions: {
      weatherSuitability: 'GOOD' as const,
      userEnergyLevel: 'HIGH' as const,
      availableTime: 45,
      urgencyLevel: 'PLANNED' as const,
      difficultyLevel: ActivityDifficulty.EASY,
    },
  };

  // Tính toán user performance
  const userPerformance = {
    skillAssessment: {
      currentSkillLevel: UserSkillLevel.INTERMEDIATE,
      activityExpertise: 75,
      improvementRate: 5.2,
      learningProgress: {
        mistakesMade: ['watered_too_much_initially'],
        lessonsLearned: ['optimal_water_amount_for_plant_stage'],
        skillsImproved: ['water_management', 'timing'],
        nextSkillToLearn: 'advanced_fertilization',
      },
    },

    workEfficiency: {
      speedRating: 4,
      accuracyRating: 4,
      consistencyRating: 5,
      innovationRating: 3,
      speedImprovement: 8.5,
      accuracyImprovement: 3.2,
      overallImprovement: 6.1,
    },

    workingHabits: {
      preferredTimeOfDay: 'morning',
      preferredWeather: ['sunny', 'partly_cloudy'],
      workingStyle: 'SYSTEMATIC' as const,
      planningTendency: 'PLANNED' as const,
      commonMistakes: ['watering_in_hot_sun', 'over_fertilizing'],
      strengthAreas: ['consistency', 'timing', 'plant_observation'],
      improvementAreas: ['fertilizer_knowledge', 'pest_identification'],
      personalBestPractices: ['early_morning_watering', 'soil_moisture_check'],
    },

    motivation: {
      motivationLevel: 8,
      enjoymentLevel: 9,
      confidenceLevel: 7,
      stressLevel: 2,
      motivationFactors: ['plant_growth', 'learning', 'community_recognition'],
      demotivationFactors: ['bad_weather', 'plant_disease'],
      rewardPreferences: ['experience_points', 'badges', 'community_praise'],
    },
  };

  // Tính toán activity patterns
  const activityPatterns = {
    frequency: {
      dailyFrequency: 0.8,
      weeklyFrequency: 5.6,
      monthlyFrequency: 24,
      yearlyFrequency: 288,
      daysSinceLastSameActivity: 3,
      averageIntervalDays: 3.2,
      shortestInterval: 1,
      longestInterval: 7,
      frequencyRating: 'OPTIMAL' as const,
      recommendedFrequency: 3,
      nextRecommendedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },

    temporalPatterns: {
      dailyPattern: {
        preferredHours: [6, 7, 8, 17, 18],
        peakPerformanceHours: [7, 8],
        avoidedHours: [12, 13, 14, 15],
        timeDistribution: { 6: 15, 7: 35, 8: 25, 17: 15, 18: 10 },
      },

      weeklyPattern: {
        preferredDays: [1, 2, 3, 4, 5], // T2-T6
        peakPerformanceDays: [2, 3, 4], // T3-T5
        avoidedDays: [0], // CN
        weekendVsWeekday: 'WEEKDAY_PREFER' as const,
        dayDistribution: { 1: 20, 2: 25, 3: 25, 4: 20, 5: 10 },
      },

      seasonalPattern: {
        springFrequency: 32,
        summerFrequency: 28,
        autumnFrequency: 20,
        winterFrequency: 12,
        mostActiveSeasons: ['spring', 'summer'],
        seasonalEffectiveness: {
          spring: 90,
          summer: 85,
          autumn: 75,
          winter: 60,
        },
      },

      weatherPattern: {
        preferredWeatherConditions: ['sunny', 'partly_cloudy', 'overcast'],
        avoidedWeatherConditions: [
          'heavy_rain',
          'thunderstorm',
          'extreme_heat',
        ],
        weatherImpactOnPerformance: { sunny: 95, cloudy: 90, rainy: 60 },
        rainImpact: 'NEGATIVE' as const,
        temperatureOptimalRange: { min: 18, max: 28 },
      },
    },

    sequencePatterns: {
      commonPreceedingActivities: [
        ActivityType.SOIL_TESTING,
        ActivityType.WEEDING,
      ],
      commonFollowingActivities: [
        ActivityType.FERTILIZING,
        ActivityType.PRUNING,
      ],
      activityChains: [
        {
          sequence: [
            ActivityType.SOIL_TESTING,
            ActivityType.WATERING,
            ActivityType.FERTILIZING,
          ],
          frequency: 15,
          effectiveness: 92,
        },
      ],
      effectiveCombinations: [
        {
          activities: [ActivityType.WATERING, ActivityType.FERTILIZING],
          synergy: 85,
          timeGap: 2,
          successRate: 0.9,
        },
      ],
    },
  };

  // Tính toán effectiveness analysis
  const effectivenessAnalysis = {
    immediateEffectiveness: {
      taskCompletionRate: 100,
      qualityScore: 85,
      timeEfficiency: 92,
      resourceEfficiency: 88,
      overallEffectiveness: ActivityEffectiveness.EFFECTIVE,
    },

    longTermEffectiveness: {
      plantHealthImpact: 15,
      growthImpact: 12,
      yieldImpact: 8.5,
      sustainabilityImpact: 10,
      cumulativeEffect: 25,
    },

    evaluationSummary: {
      totalEvaluations: activity.evaluations.length,
      userEvaluations: activity.evaluations.filter(
        (e) => e.evaluatorType === 'USER',
      ).length,
      systemEvaluations: activity.evaluations.filter(
        (e) => e.evaluatorType === 'SYSTEM',
      ).length,
      communityEvaluations: 0,
      expertEvaluations: 0,
      averageUserRating: 4.2,
      averageSystemRating: 4.0,
      averageCommunityRating: 0,
      averageExpertRating: 0,
      weightedAverageRating: 4.1,
      ratingConsensus: 'HIGH' as const,
      controversialAspects: [],
    },

    outcomes: {
      plannedOutcomes: [
        'adequate_plant_hydration',
        'soil_moisture_improvement',
      ],
      actualOutcomes: ['plant_hydrated', 'soil_moist', 'no_water_stress'],
      unexpectedOutcomes: ['attracted_beneficial_insects'],
      missedOpportunities: ['could_have_added_nutrients'],
      successRate: 95,
      failureReasons: [],
      partialSuccessAreas: [],
      economicValue: 5000,
      timeValueSaved: 10,
      learningValue: ['optimal_watering_timing', 'plant_response_observation'],
      satisfactionValue: 8,
    },
  };

  // Tính toán learning analysis
  const learningAnalysis = {
    experienceGained: {
      xpEarned: 25,
      xpSourceBreakdown: { activity_completion: 20, quality_bonus: 5 },
      bonusXpReasons: ['perfect_timing', 'efficient_execution'],
      xpMultiplier: 1.0,
      levelBefore: activity.gardener.experienceLevel?.level || 1,
      levelAfter: activity.gardener.experienceLevel?.level || 1,
      isLevelUp: false,
      progressInCurrentLevel: 75,
      pointsToNextLevel: 150,
      estimatedTimeToNextLevel: 6,
    },

    skillDevelopment: {
      skillsImproved: [
        {
          skillName: 'watering_technique',
          previousLevel: 7,
          newLevel: 8,
          improvement: 1,
          evidenceOfImprovement: [
            'better_water_distribution',
            'no_overwatering',
          ],
        },
      ],
      newSkillsAcquired: [],
      expertiseLevelChange: 2,
      skillGapsIdentified: ['advanced_fertilization', 'pest_management'],
      recommendedLearningPath: [
        'fertilizer_types',
        'application_methods',
        'pest_identification',
      ],
      difficultyAreasToWork: [
        'nutrient_deficiency_diagnosis',
        'organic_pest_control',
      ],
    },

    mistakesAndLessons: {
      mistakesMade: [],
      lessonsLearned: [
        {
          lesson: 'morning_watering_reduces_evaporation',
          source: 'EXPERIENCE' as const,
          applicability: ['all_watering_activities'],
          importance: 8,
        },
      ],
      bestPracticesDiscovered: ['check_soil_moisture_before_watering'],
      innovativeApproaches: [],
    },

    improvementRecommendations: {
      immediateTips: [
        'check_weather_forecast_before_watering',
        'water_at_plant_base',
      ],
      shortTermGoals: [
        'learn_plant_specific_water_needs',
        'install_drip_irrigation',
      ],
      longTermGoals: [
        'master_seasonal_watering_schedules',
        'implement_smart_irrigation',
      ],
      trainingNeeds: ['irrigation_system_maintenance'],
      resourceNeeds: ['soil_moisture_meter', 'drip_irrigation_kit'],
      mentorshipNeeds: ['irrigation_specialist_guidance'],
      prioritizedImprovements: [
        {
          improvement: 'install_moisture_sensors',
          priority: 'HIGH' as const,
          effort: 'MEDIUM' as const,
          impact: 'HIGH' as const,
          timeframe: '2_weeks',
        },
      ],
    },
  };

  // Comparison analysis
  const comparisonAnalysis = {
    selfComparison: {
      vsLastTime: {
        performanceChange: 5.2,
        timeChange: -3,
        qualityChange: 8,
        efficiencyChange: 12,
        overallTrend: TrendDirection.IMPROVING,
      },
      vsPersonalAverage: {
        performanceVsAverage: 110,
        aboveAverageAspects: ['timing', 'efficiency', 'quality'],
        belowAverageAspects: [],
        personalBest: false,
        personalRecord: 'fastest_completion_time',
      },
      progressOverTime: {
        last7Days: TrendDirection.IMPROVING,
        last30Days: TrendDirection.STABLE,
        last90Days: TrendDirection.IMPROVING,
        last365Days: TrendDirection.IMPROVING,
        overallCareerTrend: TrendDirection.IMPROVING,
      },
    },

    communityComparison: {
      ranking: {
        globalRank: 156,
        totalUsers: 2500,
        percentile: 93.8,
        categoryRank: 23,
        levelRank: 12,
        regionRank: 8,
      },
      communityBenchmarks: {
        averageRating: 3.2,
        averageTime: 35,
        averageFrequency: 4.5,
        averageEffectiveness: 75,
        top10Percent: {
          averageRating: 4.8,
          averageTime: 25,
          commonTechniques: ['early_morning_watering', 'soil_moisture_testing'],
          successFactors: ['consistency', 'plant_knowledge', 'timing'],
        },
        performanceGap: {
          ratingGap: 0.9,
          timeGap: 5,
          efficiencyGap: 12,
          skillGap: ['advanced_techniques', 'specialized_tools'],
        },
      },
      learningOpportunities: {
        topPerformers: [
          {
            username: 'gardenmaster123',
            performance: 98,
            specialties: ['irrigation', 'water_management'],
            publicTips: [
              'use_mulch_to_retain_moisture',
              'water_deeply_less_frequently',
            ],
          },
        ],
        similarUsers: [
          {
            username: 'plantlover88',
            similarity: 87,
            strengths: ['consistency', 'learning_attitude'],
            collaborationOpportunities: ['knowledge_sharing', 'joint_projects'],
          },
        ],
        mentorshipOpportunities: {
          potentialMentors: ['irrigation_expert', 'master_gardener'],
          expertiseAreas: ['water_management', 'sustainable_practices'],
          availabilityStatus: 'available',
        },
      },
    },

    industryBenchmarks: {
      professionalStandards: {
        timeStandard: 20,
        qualityStandard: 90,
        frequencyStandard: 2,
        vsStandardPerformance: 105,
      },
      bestPractices: {
        industryBestPractices: [
          'precision_irrigation',
          'soil_moisture_monitoring',
        ],
        adoptedPractices: ['morning_watering', 'soil_check'],
        gapAnalysis: ['automated_systems', 'advanced_monitoring'],
        implementationPlan: [
          'research_smart_irrigation',
          'budget_for_upgrades',
        ],
      },
    },
  };

  // Predictions and recommendations
  const predictionsAndRecommendations = {
    nextActivityPredictions: {
      predictedNextActivities: [
        {
          activityType: ActivityType.FERTILIZING,
          probability: 0.8,
          recommendedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          reasoning: [
            'plant_growth_stage',
            'last_fertilization_date',
            'soil_nutrients',
          ],
          confidence: PredictionConfidence.HIGH,
        },
      ],
      optimalTimingPrediction: {
        nextOptimalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        optimalTimeOfDay: 7,
        optimalWeatherConditions: ['partly_cloudy', 'mild_temperature'],
        confidenceLevel: PredictionConfidence.HIGH,
        factors: ['weather_forecast', 'plant_needs', 'historical_success'],
      },
      outcomesPrediction: {
        expectedSuccessRate: 92,
        predictedQuality: 88,
        predictedEfficiency: 90,
        riskFactors: ['potential_rain', 'busy_schedule'],
        successFactors: [
          'good_timing',
          'proper_technique',
          'favorable_weather',
        ],
      },
    },

    improvementRecommendations: {
      immediateActions: [
        {
          action: 'install_mulch_around_plants',
          priority: 'MEDIUM' as const,
          difficulty: 'EASY' as const,
          expectedImpact: 'MEDIUM' as const,
          timeToImplement: 30,
        },
      ],
      strategicRecommendations: [
        {
          goal: 'implement_smart_irrigation_system',
          timeframe: '3_months',
          steps: [
            'research_options',
            'budget_planning',
            'installation',
            'testing',
          ],
          resources: [
            'smart_controllers',
            'moisture_sensors',
            'professional_help',
          ],
          successMetrics: ['water_usage_reduction', 'plant_health_improvement'],
          difficulty: ActivityDifficulty.MEDIUM,
        },
      ],
      learningRecommendations: [
        {
          skillToLearn: 'advanced_irrigation_techniques',
          learningMethod: ['online_courses', 'hands_on_practice', 'mentorship'],
          timeCommitment: '2_hours_per_week',
          expectedBenefit: 'improved_water_efficiency_and_plant_health',
          priority: 8,
        },
      ],
    },

    warningsAndRisks: {
      currentWarnings: [],
      potentialRisks: [
        {
          risk: 'overwatering_during_rainy_season',
          probability: 0.3,
          impact: 'MEDIUM' as const,
          prevention: ['check_weather_forecast', 'adjust_schedule'],
          mitigation: ['improve_drainage', 'reduce_frequency'],
        },
      ],
      missedOpportunities: [],
    },

    suggestedGoals: {
      shortTermGoals: [
        {
          goal: 'achieve_95%_watering_efficiency',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          measurableOutcome: 'average_efficiency_score_above_95',
          actionPlan: [
            'install_moisture_meter',
            'track_plant_response',
            'adjust_technique',
          ],
          difficulty: ActivityDifficulty.MEDIUM,
          motivation: 'better_plant_health_and_water_conservation',
        },
      ],
      longTermGoals: [
        {
          goal: 'become_irrigation_specialist_in_community',
          timeframe: '12_months',
          milestones: [
            'complete_advanced_course',
            'mentor_beginners',
            'achieve_top_10_ranking',
          ],
          resourceRequirements: [
            'advanced_equipment',
            'training_materials',
            'time_investment',
          ],
          successCriteria: [
            'community_recognition',
            'expertise_level_master',
            'teaching_others',
          ],
          strategicImportance: 9,
        },
      ],
      personalChallenges: [
        {
          challenge: '30_day_perfect_watering_streak',
          difficulty: ActivityDifficulty.MEDIUM,
          reward: 'special_badge_and_experience_bonus',
          timeLimit: '30_days',
          rules: ['daily_optimal_timing', 'perfect_amount', 'no_missed_days'],
        },
      ],
    },
  };

  return {
    id: activity.id,
    gardenId: activity.gardenId,
    gardenerId: activity.gardenerId,
    name: activity.name,
    activityType: activity.activityType,
    timestamp: activity.timestamp,
    plantName: activity.plantName || undefined,
    plantGrowStage: activity.plantGrowStage || undefined,
    humidity: activity.humidity || undefined,
    temperature: activity.temperature || undefined,
    lightIntensity: activity.lightIntensity || undefined,
    waterLevel: activity.waterLevel || undefined,
    rainfall: activity.rainfall || undefined,
    soilMoisture: activity.soilMoisture || undefined,
    soilPH: activity.soilPH || undefined,
    details: activity.details || undefined,
    reason: activity.reason || undefined,
    notes: activity.notes || undefined,

    // Chi tiết thực hiện
    executionDetails,

    // Phân tích hiệu suất người dùng
    userPerformance,

    // Mẫu hoạt động
    activityPatterns,

    // Phân tích hiệu quả
    effectivenessAnalysis,

    // Phân tích học hỏi
    learningAnalysis,

    // So sánh
    comparisonAnalysis,

    // Dự đoán và khuyến nghị
    predictionsAndRecommendations,

    // Thông tin cơ bản
    gardener: {
      userId: activity.gardener.userId,
      experiencePoints: activity.gardener.experiencePoints,
      experienceLevelId: activity.gardener.experienceLevelId,
      user: {
        firstName: activity.gardener.user.firstName,
        lastName: activity.gardener.user.lastName,
        username: activity.gardener.user.username,
        email: activity.gardener.user.email,
      },
      experienceLevel: {
        level: activity.gardener.experienceLevel?.level || 1,
        title: activity.gardener.experienceLevel?.title || 'Beginner',
        description: activity.gardener.experienceLevel?.description || '',
        icon: activity.gardener.experienceLevel?.icon || '🌱',
      },
    },

    garden: {
      name: activity.garden.name,
      type: activity.garden.type,
      status: activity.garden.status,
      plantName: activity.garden.plantName || undefined,
      plantGrowStage: activity.garden.plantGrowStage || undefined,
      city: activity.garden.city || undefined,
      district: activity.garden.district || undefined,
      ward: activity.garden.ward || undefined,
    },

    weatherObservation: activity.weatherObservation
      ? {
          temp: activity.weatherObservation.temp,
          feelsLike: activity.weatherObservation.feelsLike,
          pressure: activity.weatherObservation.pressure,
          humidity: activity.weatherObservation.humidity,
          clouds: activity.weatherObservation.clouds,
          visibility: activity.weatherObservation.visibility,
          windSpeed: activity.weatherObservation.windSpeed,
          windDeg: activity.weatherObservation.windDeg,
          windGust: activity.weatherObservation.windGust || undefined,
          rain1h: activity.weatherObservation.rain1h || undefined,
          snow1h: activity.weatherObservation.snow1h || undefined,
          weatherMain: activity.weatherObservation.weatherMain,
          weatherDesc: activity.weatherObservation.weatherDesc,
          iconCode: activity.weatherObservation.iconCode,
        }
      : undefined,

    evaluations: activity.evaluations.map((evaluation) => ({
      id: evaluation.id,
      evaluatorType: evaluation.evaluatorType,
      gardenerId: evaluation.gardenerId || undefined,
      evaluatedAt: evaluation.evaluatedAt,
      outcome: evaluation.outcome || undefined,
      rating: evaluation.rating || undefined,
      metrics: evaluation.metrics,
      comments: evaluation.comments || undefined,
      evaluator: evaluation.gardener?.user
        ? {
            firstName: evaluation.gardener.user.firstName,
            lastName: evaluation.gardener.user.lastName,
            username: evaluation.gardener.user.username,
          }
        : undefined,
    })),

    photoEvaluations: activity.photoEvaluations.map((photo) => ({
      id: photo.id,
      photoUrl: photo.photoUrl,
      aiFeedback: photo.aiFeedback || undefined,
      confidence: photo.confidence || undefined,
      notes: photo.notes || undefined,
      evaluatedAt: photo.evaluatedAt || undefined,
      plantName: photo.plantName || undefined,
      plantGrowStage: photo.plantGrowStage || undefined,
    })),

    wateringSchedules: activity.wateringSchedule.map((schedule) => ({
      id: schedule.id,
      scheduledAt: schedule.scheduledAt,
      amount: schedule.amount || undefined,
      status: schedule.status,
      notes: schedule.notes || undefined,
    })),

    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}

// Helper function để xác định mùa
function getSeason(date: Date): 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'SPRING';
  if (month >= 6 && month <= 8) return 'SUMMER';
  if (month >= 9 && month <= 11) return 'AUTUMN';
  return 'WINTER';
}
