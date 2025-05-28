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
  ActivityDifficulty,
  ActivityEffectiveness,
  PredictionConfidence,
  TrendDirection,
  UserSkillLevel,
} from './garden-activity.enums';

export class GardenActivityAnalyticsDto {
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
    startTime?: Date;
    endTime?: Date;
    actualDuration: number;
    plannedDuration?: number;
    durationEfficiency: number;
    method: string;
    toolsUsed: string[];
    materialsUsed: string[];
    workload: {
      area?: number;
      quantity?: number;
      unit?: string;
      intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'INTENSIVE';
    };
    immediateResults: {
      completed: boolean;
      completionRate: number;
      qualityRating: number;
      satisfactionLevel: number;
      issuesEncountered: string[];
      solutionsApplied: string[];
    };
    executionConditions: {
      weatherSuitability:
        | 'PERFECT'
        | 'GOOD'
        | 'ACCEPTABLE'
        | 'POOR'
        | 'UNSUITABLE';
      userEnergyLevel: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
      availableTime: number;
      urgencyLevel: 'ROUTINE' | 'PLANNED' | 'URGENT' | 'EMERGENCY';
      difficultyLevel: ActivityDifficulty;
    };
  };

  // ====================== USER PERFORMANCE ANALYSIS ======================

  @ApiProperty({ description: 'Phân tích hiệu suất người dùng' })
  userPerformance: {
    skillAssessment: {
      currentSkillLevel: UserSkillLevel;
      activityExpertise: number;
      improvementRate: number;
      learningProgress: {
        mistakesMade: string[];
        lessonsLearned: string[];
        skillsImproved: string[];
        nextSkillToLearn: string;
      };
    };
    workEfficiency: {
      speedRating: number;
      accuracyRating: number;
      consistencyRating: number;
      innovationRating: number;
      speedImprovement: number;
      accuracyImprovement: number;
      overallImprovement: number;
    };
    workingHabits: {
      preferredTimeOfDay: string;
      preferredWeather: string[];
      workingStyle: 'SYSTEMATIC' | 'FLEXIBLE' | 'SPONTANEOUS' | 'PERFECTIONIST';
      planningTendency: 'VERY_PLANNED' | 'PLANNED' | 'MODERATE' | 'SPONTANEOUS';
      commonMistakes: string[];
      strengthAreas: string[];
      improvementAreas: string[];
      personalBestPractices: string[];
    };
    motivation: {
      motivationLevel: number;
      enjoymentLevel: number;
      confidenceLevel: number;
      stressLevel: number;
      motivationFactors: string[];
      demotivationFactors: string[];
      rewardPreferences: string[];
    };
  };

  // ====================== ACTIVITY FREQUENCY & PATTERNS ======================

  @ApiProperty({ description: 'Phân tích tần suất và mẫu hoạt động' })
  activityPatterns: {
    frequency: {
      dailyFrequency: number;
      weeklyFrequency: number;
      monthlyFrequency: number;
      yearlyFrequency: number;
      daysSinceLastSameActivity?: number;
      averageIntervalDays: number;
      shortestInterval: number;
      longestInterval: number;
      frequencyRating:
        | 'TOO_FREQUENT'
        | 'OPTIMAL'
        | 'INSUFFICIENT'
        | 'RARE'
        | 'OVERDUE';
      recommendedFrequency: number;
      nextRecommendedDate: Date;
    };
    temporalPatterns: {
      dailyPattern: {
        preferredHours: number[];
        peakPerformanceHours: number[];
        avoidedHours: number[];
        timeDistribution: { [hour: number]: number };
      };
      weeklyPattern: {
        preferredDays: number[];
        peakPerformanceDays: number[];
        avoidedDays: number[];
        weekendVsWeekday: 'WEEKEND_PREFER' | 'WEEKDAY_PREFER' | 'NO_PREFERENCE';
        dayDistribution: { [day: number]: number };
      };
      seasonalPattern: {
        springFrequency: number;
        summerFrequency: number;
        autumnFrequency: number;
        winterFrequency: number;
        mostActiveSeasons: string[];
        seasonalEffectiveness: { [season: string]: number };
      };
      weatherPattern: {
        preferredWeatherConditions: string[];
        avoidedWeatherConditions: string[];
        weatherImpactOnPerformance: { [condition: string]: number };
        rainImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        temperatureOptimalRange: { min: number; max: number };
      };
    };
    sequencePatterns: {
      commonPreceedingActivities: ActivityType[];
      commonFollowingActivities: ActivityType[];
      activityChains: {
        sequence: ActivityType[];
        frequency: number;
        effectiveness: number;
      }[];
      effectiveCombinations: {
        activities: ActivityType[];
        synergy: number;
        timeGap: number;
        successRate: number;
      }[];
    };
  };

  // ====================== EFFECTIVENESS & OUTCOMES ======================

  @ApiProperty({ description: 'Phân tích hiệu quả và kết quả' })
  effectivenessAnalysis: {
    immediateEffectiveness: {
      taskCompletionRate: number;
      qualityScore: number;
      timeEfficiency: number;
      resourceEfficiency: number;
      overallEffectiveness: ActivityEffectiveness;
    };
    longTermEffectiveness: {
      plantHealthImpact: number;
      growthImpact: number;
      yieldImpact: number;
      sustainabilityImpact: number;
      cumulativeEffect: number;
    };
    evaluationSummary: {
      totalEvaluations: number;
      userEvaluations: number;
      systemEvaluations: number;
      communityEvaluations: number;
      expertEvaluations: number;
      averageUserRating: number;
      averageSystemRating: number;
      averageCommunityRating: number;
      averageExpertRating: number;
      weightedAverageRating: number;
      ratingConsensus: 'HIGH' | 'MEDIUM' | 'LOW';
      controversialAspects: string[];
    };
    outcomes: {
      plannedOutcomes: string[];
      actualOutcomes: string[];
      unexpectedOutcomes: string[];
      missedOpportunities: string[];
      successRate: number;
      failureReasons: string[];
      partialSuccessAreas: string[];
      economicValue: number;
      timeValueSaved: number;
      learningValue: string[];
      satisfactionValue: number;
    };
  };

  // ====================== LEARNING & IMPROVEMENT ======================

  @ApiProperty({ description: 'Phân tích học hỏi và cải thiện' })
  learningAnalysis: {
    experienceGained: {
      xpEarned: number;
      xpSourceBreakdown: { [source: string]: number };
      bonusXpReasons: string[];
      xpMultiplier: number;
      levelBefore: number;
      levelAfter: number;
      isLevelUp: boolean;
      progressInCurrentLevel: number;
      pointsToNextLevel: number;
      estimatedTimeToNextLevel: number;
    };
    skillDevelopment: {
      skillsImproved: {
        skillName: string;
        previousLevel: number;
        newLevel: number;
        improvement: number;
        evidenceOfImprovement: string[];
      }[];
      newSkillsAcquired: string[];
      expertiseLevelChange: number;
      skillGapsIdentified: string[];
      recommendedLearningPath: string[];
      difficultyAreasToWork: string[];
    };
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
        importance: number;
      }[];
      bestPracticesDiscovered: string[];
      innovativeApproaches: string[];
    };
    improvementRecommendations: {
      immediateTips: string[];
      shortTermGoals: string[];
      longTermGoals: string[];
      trainingNeeds: string[];
      resourceNeeds: string[];
      mentorshipNeeds: string[];
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
    selfComparison: {
      vsLastTime: {
        performanceChange: number;
        timeChange: number;
        qualityChange: number;
        efficiencyChange: number;
        overallTrend: TrendDirection;
      };
      vsPersonalAverage: {
        performanceVsAverage: number;
        aboveAverageAspects: string[];
        belowAverageAspects: string[];
        personalBest: boolean;
        personalRecord: string;
      };
      progressOverTime: {
        last7Days: TrendDirection;
        last30Days: TrendDirection;
        last90Days: TrendDirection;
        last365Days: TrendDirection;
        overallCareerTrend: TrendDirection;
      };
    };
    communityComparison: {
      ranking: {
        globalRank: number;
        totalUsers: number;
        percentile: number;
        categoryRank: number;
        levelRank: number;
        regionRank: number;
      };
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
      learningOpportunities: {
        topPerformers: {
          username: string;
          performance: number;
          specialties: string[];
          publicTips: string[];
        }[];
        similarUsers: {
          username: string;
          similarity: number;
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
    industryBenchmarks: {
      professionalStandards: {
        timeStandard: number;
        qualityStandard: number;
        frequencyStandard: number;
        vsStandardPerformance: number;
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
    nextActivityPredictions: {
      predictedNextActivities: {
        activityType: ActivityType;
        probability: number;
        recommendedDate: Date;
        reasoning: string[];
        confidence: PredictionConfidence;
      }[];
      optimalTimingPrediction: {
        nextOptimalDate: Date;
        optimalTimeOfDay: number;
        optimalWeatherConditions: string[];
        confidenceLevel: PredictionConfidence;
        factors: string[];
      };
      outcomesPrediction: {
        expectedSuccessRate: number;
        predictedQuality: number;
        predictedEfficiency: number;
        riskFactors: string[];
        successFactors: string[];
      };
    };
    improvementRecommendations: {
      immediateActions: {
        action: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        expectedImpact: 'HIGH' | 'MEDIUM' | 'LOW';
        timeToImplement: number;
      }[];
      strategicRecommendations: {
        goal: string;
        timeframe: string;
        steps: string[];
        resources: string[];
        successMetrics: string[];
        difficulty: ActivityDifficulty;
      }[];
      learningRecommendations: {
        skillToLearn: string;
        learningMethod: string[];
        timeCommitment: string;
        expectedBenefit: string;
        priority: number;
      }[];
    };
    warningsAndRisks: {
      currentWarnings: {
        warning: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        actionRequired: string;
        deadline?: Date;
      }[];
      potentialRisks: {
        risk: string;
        probability: number;
        impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
        prevention: string[];
        mitigation: string[];
      }[];
      missedOpportunities: {
        opportunity: string;
        timeWindow: string;
        benefit: string;
        actionNeeded: string;
      }[];
    };
    suggestedGoals: {
      shortTermGoals: {
        goal: string;
        deadline: Date;
        measurableOutcome: string;
        actionPlan: string[];
        difficulty: ActivityDifficulty;
        motivation: string;
      }[];
      longTermGoals: {
        goal: string;
        timeframe: string;
        milestones: string[];
        resourceRequirements: string[];
        successCriteria: string[];
        strategicImportance: number;
      }[];
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

export function mapToGardenActivityAnalyticsDto(
  activity: GardenActivity & {
    gardener: Gardener & {
      user: User;
      experienceLevel: any;
    };
    garden: Garden;
    weatherObservation: WeatherObservation | null;
    evaluations: (ActivityEvaluation & {
      gardener?: {
        user: {
          firstName: string;
          lastName: string;
          username: string;
        };
      } | null;
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
): GardenActivityAnalyticsDto {
  const executionDetails = {
    actualDuration: 30, // phút
    durationEfficiency: 95, // %
    method: 'Thủ công',
    toolsUsed: ['Bình tưới', 'Găng tay làm vườn'],
    materialsUsed: ['Nước', 'Phân bón'],
    workload: {
      area: 2.5, // m2
      quantity: 5, // lít nước
      unit: 'lít',
      intensity: 'MEDIUM' as const,
    },
    immediateResults: {
      completed: true,
      completionRate: 100, // %
      qualityRating: 4, // 1-5
      satisfactionLevel: 4, // 1-5
      issuesEncountered: [],
      solutionsApplied: ['Điều chỉnh lượng nước tưới'],
    },
    executionConditions: {
      weatherSuitability: 'GOOD' as const, // Tốt
      userEnergyLevel: 'HIGH' as const, // Cao
      availableTime: 45, // phút
      urgencyLevel: 'PLANNED' as const, // Đã lên kế hoạch
      difficultyLevel: ActivityDifficulty.EASY, // Dễ
    },
  };

  const userPerformance = {
    skillAssessment: {
      currentSkillLevel: UserSkillLevel.INTERMEDIATE, // Trung bình
      activityExpertise: 75, // Độ thành thạo
      improvementRate: 5.2, // Tỷ lệ cải thiện
      learningProgress: {
        mistakesMade: ['Ban đầu tưới quá nhiều nước'],
        lessonsLearned: ['Lượng nước tối ưu cho giai đoạn cây'],
        skillsImproved: ['Quản lý nước', 'Thời điểm tưới'],
        nextSkillToLearn: 'Kỹ thuật bón phân nâng cao',
      },
    },
    workEfficiency: {
      speedRating: 4, // Tốc độ (1-5)
      accuracyRating: 4, // Độ chính xác (1-5)
      consistencyRating: 5, // Tính nhất quán (1-5)
      innovationRating: 3, // Tính sáng tạo (1-5)
      speedImprovement: 8.5, // % Cải thiện tốc độ
      accuracyImprovement: 3.2, // % Cải thiện độ chính xác
      overallImprovement: 6.1, // % Cải thiện tổng thể
    },
    workingHabits: {
      preferredTimeOfDay: 'Buổi sáng',
      preferredWeather: ['Nắng', 'Ít mây'],
      workingStyle: 'SYSTEMATIC' as const, // Có hệ thống
      planningTendency: 'PLANNED' as const, // Có kế hoạch
      commonMistakes: ['Tưới cây dưới nắng gắt', 'Bón phân quá liều'],
      strengthAreas: ['Tính nhất quán', 'Thời điểm', 'Quan sát cây'],
      improvementAreas: ['Kiến thức về phân bón', 'Nhận diện sâu bệnh'],
      personalBestPractices: ['Tưới nước sáng sớm', 'Kiểm tra độ ẩm đất'],
    },
    motivation: {
      motivationLevel: 8, // Mức độ (1-10)
      enjoymentLevel: 9, // Mức độ yêu thích (1-10)
      confidenceLevel: 7, // Mức độ tự tin (1-10)
      stressLevel: 2, // Mức độ căng thẳng (1-10)
      motivationFactors: ['Cây phát triển', 'Học hỏi', 'Ghi nhận từ cộng đồng'],
      demotivationFactors: ['Thời tiết xấu', 'Sâu bệnh'],
      rewardPreferences: [
        'Điểm kinh nghiệm',
        'Huy hiệu',
        'Khen thưởng từ cộng đồng',
      ],
    },
  };

  const activityPatterns = {
    frequency: {
      dailyFrequency: 0.8, // lần/ngày
      weeklyFrequency: 5.6, // lần/tuần
      monthlyFrequency: 24, // lần/tháng
      yearlyFrequency: 288, // lần/năm (dự kiến)
      daysSinceLastSameActivity: 3, // ngày kể từ lần cuối
      averageIntervalDays: 3.2, // khoảng cách trung bình (ngày)
      shortestInterval: 1, // khoảng cách ngắn nhất (ngày)
      longestInterval: 7, // khoảng cách dài nhất (ngày)
      frequencyRating: 'OPTIMAL' as const, // Tối ưu
      recommendedFrequency: 3, // tần suất khuyến nghị (ngày)
      nextRecommendedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    temporalPatterns: {
      dailyPattern: {
        preferredHours: [6, 7, 8, 17, 18], // Giờ thường làm
        peakPerformanceHours: [7, 8], // Giờ hiệu suất cao nhất
        avoidedHours: [12, 13, 14, 15], // Giờ tránh làm
        timeDistribution: { 6: 15, 7: 35, 8: 25, 17: 15, 18: 10 }, // Phân bổ %
      },
      weeklyPattern: {
        preferredDays: [1, 2, 3, 4, 5], // Ngày thường làm (T2-T6)
        peakPerformanceDays: [2, 3, 4], // Ngày hiệu suất cao (T3-T5)
        avoidedDays: [0], // Ngày tránh làm (CN)
        weekendVsWeekday: 'WEEKDAY_PREFER' as const, // Ưu tiên ngày thường
        dayDistribution: { 1: 20, 2: 25, 3: 25, 4: 20, 5: 10 }, // Phân bổ %
      },
      seasonalPattern: {
        springFrequency: 32, // Tần suất mùa xuân
        summerFrequency: 28, // Tần suất mùa hè
        autumnFrequency: 20, // Tần suất mùa thu
        winterFrequency: 12, // Tần suất mùa đông
        mostActiveSeasons: ['Xuân', 'Hè'], // Mùa hoạt động nhiều nhất
        seasonalEffectiveness: {
          spring: 90,
          summer: 85,
          autumn: 75,
          winter: 60,
        }, // Hiệu quả theo mùa (%)
      },
      weatherPattern: {
        preferredWeatherConditions: ['Nắng', 'Ít mây', 'Nhiều mây'],
        avoidedWeatherConditions: ['Mưa lớn', 'Dông bão', 'Nắng nóng gay gắt'],
        weatherImpactOnPerformance: { Nắng: 95, 'Ít mây': 90, Mưa: 60 }, // Ảnh hưởng (%)
        rainImpact: 'NEGATIVE' as const, // Tiêu cực
        temperatureOptimalRange: { min: 18, max: 28 }, // Khoảng nhiệt độ tối ưu (°C)
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
          frequency: 15, // Tần suất
          effectiveness: 92, // Hiệu quả (%)
        },
      ],
      effectiveCombinations: [
        {
          activities: [ActivityType.WATERING, ActivityType.FERTILIZING],
          synergy: 85, // Độ hiệp lực (%)
          timeGap: 2, // Khoảng cách thời gian (giờ)
          successRate: 0.9, // Tỷ lệ thành công
        },
      ],
    },
  };

  const effectivenessAnalysis = {
    immediateEffectiveness: {
      taskCompletionRate: 100, // Tỷ lệ hoàn thành (%)
      qualityScore: 85, // Điểm chất lượng (0-100)
      timeEfficiency: 92, // Hiệu suất thời gian (0-100)
      resourceEfficiency: 88, // Hiệu suất tài nguyên (0-100)
      overallEffectiveness: ActivityEffectiveness.EFFECTIVE, // Hiệu quả tổng thể
    },
    longTermEffectiveness: {
      plantHealthImpact: 15, // Tác động sức khỏe cây (-100 đến 100)
      growthImpact: 12, // Tác động tăng trưởng (-100 đến 100)
      yieldImpact: 8.5, // % ảnh hưởng năng suất
      sustainabilityImpact: 10, // Tác động bền vững (-100 đến 100)
      cumulativeEffect: 25, // Hiệu ứng tích lũy
    },
    evaluationSummary: {
      totalEvaluations: activity.evaluations.length, // Tổng số đánh giá
      userEvaluations: activity.evaluations.filter(
        (e) => e.evaluatorType === 'USER',
      ).length,
      systemEvaluations: activity.evaluations.filter(
        (e) => e.evaluatorType === 'SYSTEM',
      ).length,
      communityEvaluations: 0,
      expertEvaluations: 0,
      averageUserRating: 4.2, // Đánh giá trung bình từ người dùng
      averageSystemRating: 4.0, // Đánh giá trung bình từ hệ thống
      averageCommunityRating: 0,
      averageExpertRating: 0,
      weightedAverageRating: 4.1, // Đánh giá trung bình có trọng số
      ratingConsensus: 'HIGH' as const, // Độ đồng thuận
      controversialAspects: [], // Khía cạnh gây tranh cãi
    },
    outcomes: {
      plannedOutcomes: ['Cây đủ nước', 'Cải thiện độ ẩm đất'],
      actualOutcomes: [
        'Cây được tưới đủ nước',
        'Đất ẩm',
        'Không có dấu hiệu thiếu nước',
      ],
      unexpectedOutcomes: ['Thu hút côn trùng có ích'],
      missedOpportunities: ['Có thể đã bổ sung dinh dưỡng'],
      successRate: 95, // Tỷ lệ thành công (%)
      failureReasons: [], // Lý do thất bại
      partialSuccessAreas: [], // Khu vực thành công một phần
      economicValue: 5000, // Giá trị kinh tế (VND)
      timeValueSaved: 10, // Thời gian tiết kiệm (phút)
      learningValue: ['Thời điểm tưới tối ưu', 'Quan sát phản ứng của cây'],
      satisfactionValue: 8, // Mức độ hài lòng (1-10)
    },
  };

  const learningAnalysis = {
    experienceGained: {
      xpEarned: 25, // Điểm kinh nghiệm nhận được
      xpSourceBreakdown: { 'Hoàn thành hoạt động': 20, 'Thưởng chất lượng': 5 },
      bonusXpReasons: ['Đúng thời điểm', 'Thực hiện hiệu quả'],
      xpMultiplier: 1.0, // Hệ số nhân XP
      levelBefore: activity.gardener.experienceLevel?.level || 1, // Cấp độ trước
      levelAfter: activity.gardener.experienceLevel?.level || 1, // Cấp độ sau
      isLevelUp: false, // Có lên cấp không
      progressInCurrentLevel: 75, // % tiến độ cấp hiện tại
      pointsToNextLevel: 150, // Điểm cần để lên cấp tiếp theo
      estimatedTimeToNextLevel: 6, // Thời gian dự kiến lên cấp (ngày)
    },
    skillDevelopment: {
      skillsImproved: [
        {
          skillName: 'Kỹ thuật tưới nước',
          previousLevel: 7,
          newLevel: 8,
          improvement: 1,
          evidenceOfImprovement: [
            'Phân bổ nước tốt hơn',
            'Không tưới quá nhiều',
          ],
        },
      ],
      newSkillsAcquired: [], // Kỹ năng mới học được
      expertiseLevelChange: 2, // Thay đổi độ thành thạo
      skillGapsIdentified: ['Bón phân nâng cao', 'Quản lý sâu bệnh'],
      recommendedLearningPath: [
        'Các loại phân bón',
        'Phương pháp bón',
        'Nhận diện sâu bệnh',
      ],
      difficultyAreasToWork: [
        'Chẩn đoán thiếu hụt dinh dưỡng',
        'Kiểm soát sâu bệnh hữu cơ',
      ],
    },
    mistakesAndLessons: {
      mistakesMade: [],
      lessonsLearned: [
        {
          lesson: 'Tưới nước buổi sáng giúp giảm bốc hơi',
          source: 'EXPERIENCE' as const, // Từ kinh nghiệm
          applicability: ['Tất cả hoạt động tưới nước'],
          importance: 8, // Mức độ quan trọng (1-10)
        },
      ],
      bestPracticesDiscovered: ['Kiểm tra độ ẩm đất trước khi tưới'],
      innovativeApproaches: [], // Cách tiếp cận sáng tạo
    },
    improvementRecommendations: {
      immediateTips: [
        'Kiểm tra dự báo thời tiết trước khi tưới',
        'Tưới vào gốc cây',
      ],
      shortTermGoals: [
        'Tìm hiểu nhu cầu nước cụ thể của cây',
        'Lắp đặt hệ thống tưới nhỏ giọt',
      ],
      longTermGoals: [
        'Nắm vững lịch tưới theo mùa',
        'Triển khai hệ thống tưới thông minh',
      ],
      trainingNeeds: ['Bảo trì hệ thống tưới'],
      resourceNeeds: ['Máy đo độ ẩm đất', 'Bộ tưới nhỏ giọt'],
      mentorshipNeeds: ['Hướng dẫn từ chuyên gia tưới tiêu'],
      prioritizedImprovements: [
        {
          improvement: 'Lắp đặt cảm biến độ ẩm',
          priority: 'HIGH' as const, // Cao
          effort: 'MEDIUM' as const, // Trung bình
          impact: 'HIGH' as const, // Cao
          timeframe: '2 tuần',
        },
      ],
    },
  };

  const comparisonAnalysis = {
    selfComparison: {
      vsLastTime: {
        performanceChange: 5.2, // % thay đổi hiệu suất
        timeChange: -3, // thay đổi thời gian (phút)
        qualityChange: 8, // thay đổi chất lượng (%)
        efficiencyChange: 12, // thay đổi hiệu suất (%)
        overallTrend: TrendDirection.IMPROVING, // Xu hướng cải thiện
      },
      vsPersonalAverage: {
        performanceVsAverage: 110, // % so với trung bình cá nhân
        aboveAverageAspects: ['Thời điểm', 'Hiệu suất', 'Chất lượng'],
        belowAverageAspects: [],
        personalBest: false, // Có phải thành tích tốt nhất không
        personalRecord: 'Thời gian hoàn thành nhanh nhất', // Kỷ lục cá nhân
      },
      progressOverTime: {
        last7Days: TrendDirection.IMPROVING, // 7 ngày qua
        last30Days: TrendDirection.STABLE, // 30 ngày qua
        last90Days: TrendDirection.IMPROVING, // 90 ngày qua
        last365Days: TrendDirection.IMPROVING, // 365 ngày qua
        overallCareerTrend: TrendDirection.IMPROVING, // Xu hướng chung
      },
    },
    communityComparison: {
      ranking: {
        globalRank: 156, // Xếp hạng toàn cầu
        totalUsers: 2500, // Tổng số người dùng
        percentile: 93.8, // Phần trăm xếp hạng
        categoryRank: 23, // Xếp hạng trong danh mục
        levelRank: 12, // Xếp hạng theo cấp độ
        regionRank: 8, // Xếp hạng khu vực
      },
      communityBenchmarks: {
        averageRating: 3.2, // Đánh giá trung bình cộng đồng
        averageTime: 35, // Thời gian trung bình cộng đồng
        averageFrequency: 4.5, // Tần suất trung bình cộng đồng
        averageEffectiveness: 75, // Hiệu quả trung bình cộng đồng (%)
        top10Percent: {
          averageRating: 4.8,
          averageTime: 25,
          commonTechniques: ['Tưới nước sáng sớm', 'Kiểm tra độ ẩm đất'],
          successFactors: ['Tính nhất quán', 'Kiến thức về cây', 'Thời điểm'],
        },
        performanceGap: {
          ratingGap: 0.9, // Chênh lệch đánh giá
          timeGap: 5, // Chênh lệch thời gian
          efficiencyGap: 12, // Chênh lệch hiệu suất
          skillGap: ['Kỹ thuật nâng cao', 'Công cụ chuyên dụng'], // Khoảng cách kỹ năng
        },
      },
      learningOpportunities: {
        topPerformers: [
          {
            username: 'gardenmaster123',
            performance: 98, // %
            specialties: ['Tưới tiêu', 'Quản lý nước'],
            publicTips: [
              'Sử dụng lớp phủ để giữ ẩm',
              'Tưới sâu, ít thường xuyên hơn',
            ],
          },
        ],
        similarUsers: [
          {
            username: 'plantlover88',
            similarity: 87, // % tương đồng
            strengths: ['Tính nhất quán', 'Thái độ học hỏi'],
            collaborationOpportunities: ['Chia sẻ kiến thức', 'Dự án chung'],
          },
        ],
        mentorshipOpportunities: {
          potentialMentors: ['Chuyên gia tưới tiêu', 'Nghệ nhân làm vườn'],
          expertiseAreas: ['Quản lý nước', 'Thực hành bền vững'],
          availabilityStatus: 'Sẵn sàng', // Trạng thái sẵn sàng
        },
      },
    },
    industryBenchmarks: {
      professionalStandards: {
        timeStandard: 20, // Tiêu chuẩn thời gian (phút)
        qualityStandard: 90, // Tiêu chuẩn chất lượng (%)
        frequencyStandard: 2, // Tiêu chuẩn tần suất (lần/ngày)
        vsStandardPerformance: 105, // % so với tiêu chuẩn
      },
      bestPractices: {
        industryBestPractices: ['Tưới tiêu chính xác', 'Theo dõi độ ẩm đất'],
        adoptedPractices: ['Tưới nước buổi sáng', 'Kiểm tra đất'],
        gapAnalysis: ['Hệ thống tự động', 'Theo dõi nâng cao'],
        implementationPlan: [
          'Nghiên cứu hệ thống tưới thông minh',
          'Lên ngân sách nâng cấp',
        ],
      },
    },
  };

  const predictionsAndRecommendations = {
    nextActivityPredictions: {
      predictedNextActivities: [
        {
          activityType: ActivityType.FERTILIZING,
          probability: 0.8, // Xác suất
          recommendedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ngày khuyến nghị
          reasoning: [
            'Giai đoạn phát triển của cây',
            'Ngày bón phân cuối',
            'Dinh dưỡng đất',
          ], // Lý do
          confidence: PredictionConfidence.HIGH, // Độ tin cậy
        },
      ],
      optimalTimingPrediction: {
        nextOptimalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Ngày tối ưu tiếp theo
        optimalTimeOfDay: 7, // Giờ tối ưu trong ngày
        optimalWeatherConditions: ['Ít mây', 'Nhiệt độ ôn hòa'], // Điều kiện thời tiết tối ưu
        confidenceLevel: PredictionConfidence.HIGH, // Mức độ tin cậy
        factors: [
          'Dự báo thời tiết',
          'Nhu cầu của cây',
          'Thành công trong quá khứ',
        ], // Yếu tố ảnh hưởng
      },
      outcomesPrediction: {
        expectedSuccessRate: 92, // Tỷ lệ thành công dự kiến (%)
        predictedQuality: 88, // Chất lượng dự kiến (%)
        predictedEfficiency: 90, // Hiệu suất dự kiến (%)
        riskFactors: ['Khả năng có mưa', 'Lịch trình bận rộn'], // Yếu tố rủi ro
        successFactors: [
          'Thời điểm tốt',
          'Kỹ thuật đúng',
          'Thời tiết thuận lợi',
        ], // Yếu tố thành công
      },
    },
    improvementRecommendations: {
      immediateActions: [
        {
          action: 'Phủ lớp mùn quanh cây',
          priority: 'MEDIUM' as const, // Trung bình
          difficulty: 'EASY' as const, // Dễ
          expectedImpact: 'MEDIUM' as const, // Trung bình
          timeToImplement: 30, // Thời gian thực hiện (phút)
        },
      ],
      strategicRecommendations: [
        {
          goal: 'Triển khai hệ thống tưới thông minh',
          timeframe: '3 tháng', // Khung thời gian
          steps: [
            'Nghiên cứu các lựa chọn',
            'Lập kế hoạch ngân sách',
            'Lắp đặt',
            'Kiểm tra',
          ], // Các bước
          resources: [
            'Bộ điều khiển thông minh',
            'Cảm biến độ ẩm',
            'Hỗ trợ chuyên nghiệp',
          ], // Nguồn lực
          successMetrics: ['Giảm lượng nước sử dụng', 'Cải thiện sức khỏe cây'], // Chỉ số thành công
          difficulty: ActivityDifficulty.MEDIUM, // Độ khó trung bình
        },
      ],
      learningRecommendations: [
        {
          skillToLearn: 'Kỹ thuật tưới tiêu nâng cao',
          learningMethod: ['Khóa học trực tuyến', 'Thực hành', 'Hướng dẫn'], // Phương pháp học
          timeCommitment: '2 giờ/tuần', // Thời gian cam kết
          expectedBenefit: 'Cải thiện hiệu quả sử dụng nước và sức khỏe cây', // Lợi ích dự kiến
          priority: 8, // Mức độ ưu tiên (1-10)
        },
      ],
    },
    warningsAndRisks: {
      currentWarnings: [], // Cảnh báo hiện tại
      potentialRisks: [
        {
          risk: 'Tưới quá nhiều nước vào mùa mưa',
          probability: 0.3, // Xác suất
          impact: 'MEDIUM' as const, // Tác động trung bình
          prevention: ['Kiểm tra dự báo thời tiết', 'Điều chỉnh lịch tưới'], // Phòng ngừa
          mitigation: ['Cải thiện hệ thống thoát nước', 'Giảm tần suất tưới'], // Giảm thiểu
        },
      ],
      missedOpportunities: [], // Cơ hội bỏ lỡ
    },
    suggestedGoals: {
      shortTermGoals: [
        {
          goal: 'Đạt hiệu suất tưới nước 95%',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Hạn chót
          measurableOutcome: 'Điểm hiệu suất trung bình trên 95', // Kết quả có thể đo lường
          actionPlan: [
            'Lắp đặt máy đo độ ẩm',
            'Theo dõi phản ứng của cây',
            'Điều chỉnh kỹ thuật',
          ], // Kế hoạch hành động
          difficulty: ActivityDifficulty.MEDIUM, // Độ khó trung bình
          motivation: 'Sức khỏe cây tốt hơn và tiết kiệm nước', // Động lực
        },
      ],
      longTermGoals: [
        {
          goal: 'Trở thành chuyên gia tưới tiêu trong cộng đồng',
          timeframe: '12 tháng', // Khung thời gian
          milestones: [
            'Hoàn thành khóa học nâng cao',
            'Hướng dẫn người mới',
            'Đạt top 10 xếp hạng',
          ], // Các mốc quan trọng
          resourceRequirements: [
            'Thiết bị nâng cao',
            'Tài liệu đào tạo',
            'Đầu tư thời gian',
          ], // Yêu cầu nguồn lực
          successCriteria: [
            'Ghi nhận từ cộng đồng',
            'Đạt cấp độ chuyên gia',
            'Dạy người khác',
          ], // Tiêu chí thành công
          strategicImportance: 9, // Tầm quan trọng chiến lược (1-10)
        },
      ],
      personalChallenges: [
        {
          challenge: 'Chuỗi 30 ngày tưới nước hoàn hảo',
          difficulty: ActivityDifficulty.MEDIUM, // Độ khó trung bình
          reward: 'Huy hiệu đặc biệt và thưởng kinh nghiệm', // Phần thưởng
          timeLimit: '30 ngày', // Giới hạn thời gian
          rules: [
            'Thời điểm tối ưu hàng ngày',
            'Lượng nước hoàn hảo',
            'Không bỏ sót ngày nào',
          ], // Luật lệ
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
    executionDetails,
    userPerformance,
    activityPatterns,
    effectivenessAnalysis,
    learningAnalysis,
    comparisonAnalysis,
    predictionsAndRecommendations,
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
        title: activity.gardener.experienceLevel?.title || 'Người mới bắt đầu',
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
