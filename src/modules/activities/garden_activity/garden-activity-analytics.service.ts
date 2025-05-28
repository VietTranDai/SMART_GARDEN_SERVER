import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GardenActivityAnalyticsDto,
  mapToGardenActivityAnalyticsDto,
} from './dto/garden-activity-analytics.dto';
import {
  ActivityDifficulty,
  ActivityEffectiveness,
  PredictionConfidence,
  TrendDirection,
  UserSkillLevel,
} from './dto/garden-activity.enums';
import { ActivityType, EvaluatorType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GardenActivityAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thống kê chi tiết cho một hoạt động làm vườn cụ thể
   * Phương thức này sẽ phân tích toàn diện hoạt động của bạn và đưa ra những thông tin hữu ích
   * để giúp bạn cải thiện kỹ năng làm vườn
   *
   * @param activityId ID của hoạt động cần phân tích
   * @param gardenerId ID của người làm vườn (để đảm bảo quyền riêng tư)
   * @returns Báo cáo thống kê chi tiết và thân thiện về hoạt động làm vườn
   */
  async getActivityAnalytics(
    activityId: number,
    gardenerId: number,
  ): Promise<GardenActivityAnalyticsDto> {
    // Tìm kiếm hoạt động của bạn với tất cả thông tin liên quan
    const activity = await this.prisma.gardenActivity.findFirst({
      where: {
        id: activityId,
        gardenerId: gardenerId, // Chỉ cho phép xem hoạt động của chính bạn
      },
      include: {
        gardener: {
          include: {
            user: true,
            experienceLevel: true,
          },
        },
        garden: true,
        weatherObservation: true,
        evaluations: {
          include: {
            gardener: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
        photoEvaluations: true,
        wateringSchedule: true,
      },
    });

    if (!activity) {
      throw new NotFoundException(
        'Rất tiếc, chúng tôi không tìm thấy hoạt động làm vườn này trong hệ thống của bạn. ' +
          'Có thể hoạt động này không tồn tại hoặc bạn không có quyền truy cập vào nó. ' +
          'Vui lòng kiểm tra lại ID hoạt động hoặc liên hệ với chúng tôi nếu bạn cần hỗ trợ.',
      );
    }

    // Thu thập và phân tích dữ liệu bổ sung để tạo ra báo cáo toàn diện
    const additionalAnalytics = await this.getAdditionalAnalyticsData(
      activity,
      gardenerId,
    );

    // Tạo báo cáo chi tiết với ngôn ngữ thân thiện
    return mapToGardenActivityAnalyticsDto(activity, additionalAnalytics);
  }

  /**
   * Thu thập dữ liệu từ nhiều nguồn để tạo ra phân tích sâu sắc
   * Chúng tôi sẽ xem xét lịch sử hoạt động, so sánh với cộng đồng và đưa ra dự đoán thông minh
   */
  private async getAdditionalAnalyticsData(
    activity: any,
    gardenerId: number,
  ): Promise<{
    userPerformanceData: any;
    communityData: any;
    historicalData: any;
    predictionData: any;
  }> {
    // Phân tích lịch sử hoạt động của bạn để hiểu xu hướng và tiến bộ
    const historicalData = await this.getUserHistoricalData(
      gardenerId,
      activity.activityType,
    );

    // So sánh với cộng đồng để thấy bạn đang ở vị trí nào
    const communityData = await this.getCommunityBenchmarkData(
      activity.activityType,
    );

    // Đánh giá hiệu suất cá nhân và điểm mạnh, điểm cần cải thiện
    const userPerformanceData = await this.analyzeUserPerformance(
      gardenerId,
      activity,
      historicalData,
    );

    // Dự đoán và gợi ý cho tương lai dựa trên AI và kinh nghiệm
    const predictionData = await this.generatePredictions(
      gardenerId,
      activity,
      historicalData,
    );

    return {
      userPerformanceData,
      communityData,
      historicalData,
      predictionData,
    };
  }

  /**
   * Khám phá lịch sử hoạt động của bạn để hiểu rõ hành trình làm vườn
   * Chúng tôi sẽ phân tích từng giai đoạn để thấy sự tiến bộ và những điều thú vị
   */
  private async getUserHistoricalData(
    gardenerId: number,
    activityType: ActivityType,
  ) {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last365Days = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Lấy tất cả hoạt động cùng loại trong năm qua để phân tích xu hướng
    const historicalActivities = await this.prisma.gardenActivity.findMany({
      where: {
        gardenerId,
        activityType,
        timestamp: {
          gte: last365Days,
        },
      },
      include: {
        evaluations: true,
        garden: {
          select: {
            name: true,
            plantName: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Phân loại theo thời gian để thấy rõ sự phát triển
    const activitiesByPeriod = {
      last7Days: historicalActivities.filter((a) => a.timestamp >= last7Days),
      last30Days: historicalActivities.filter((a) => a.timestamp >= last30Days),
      last90Days: historicalActivities.filter((a) => a.timestamp >= last90Days),
      last365Days: historicalActivities,
    };

    const averageRating = this.calculateAverageRating(historicalActivities);
    const frequencyData = this.calculateFrequencyData(historicalActivities);
    const performanceTrend =
      this.calculatePerformanceTrend(historicalActivities);

    return {
      total: historicalActivities.length,
      ...Object.fromEntries(
        Object.entries(activitiesByPeriod).map(([period, activities]) => [
          period.replace('last', '').replace('Days', ''),
          activities.length,
        ]),
      ),
      activities: historicalActivities,
      averageRating,
      frequencyData,
      performanceTrend,
      insights: this.generateHistoricalInsights(
        historicalActivities,
        activitiesByPeriod,
        averageRating,
      ),
    };
  }

  /**
   * So sánh với cộng đồng để thấy bạn đang ở đâu trên bản đồ làm vườn
   * Điều này giúp bạn hiểu được năng lực và có động lực phát triển hơn
   */
  private async getCommunityBenchmarkData(activityType: ActivityType) {
    // Thống kê tổng quát từ cộng đồng
    const communityStats = await this.prisma.gardenActivity.aggregate({
      where: {
        activityType,
        timestamp: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 tháng gần đây
        },
      },
      _count: {
        id: true,
      },
    });

    // Đánh giá trung bình của cộng đồng
    const communityEvaluations = await this.prisma.activityEvaluation.aggregate(
      {
        where: {
          gardenActivity: {
            activityType,
            timestamp: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
          rating: {
            not: null,
          },
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      },
    );

    // Lấy thông tin về những người dùng xuất sắc để học hỏi
    const topPerformers = await this.getTopPerformersData(activityType);

    return {
      totalActivities: communityStats._count.id,
      averageRating: communityEvaluations._avg.rating || 3.0,
      totalEvaluations: communityEvaluations._count.rating,
      topPerformers,
      communityInsights: this.generateCommunityInsights(
        communityStats._count.id,
        communityEvaluations._avg.rating || 3.0,
      ),
    };
  }

  /**
   * Tìm hiểu những người làm vườn xuất sắc để học hỏi kinh nghiệm
   */
  private async getTopPerformersData(activityType: ActivityType) {
    const topPerformers = await this.prisma.activityEvaluation.groupBy({
      by: ['gardenerId'],
      where: {
        gardenActivity: {
          activityType,
        },
        rating: {
          gte: 4, // Chỉ lấy những đánh giá tốt
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
      having: {
        rating: {
          _count: {
            gte: 5, // Ít nhất 5 hoạt động để đảm bảo độ tin cậy
          },
        },
      },
      orderBy: {
        _avg: {
          rating: 'desc',
        },
      },
      take: 5,
    });

    // Lấy thông tin chi tiết của những người xuất sắc
    const topPerformersDetails = await Promise.all(
      topPerformers.map(async (performer) => {
        const gardener = await this.prisma.gardener.findUnique({
          where: { userId: performer.gardenerId! },
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
              },
            },
            experienceLevel: true,
          },
        });

        return {
          username: gardener?.user.username || 'Người dùng ẩn danh',
          displayName: gardener?.user.firstName || 'Người làm vườn',
          averageRating: performer._avg.rating || 0,
          totalActivities: performer._count.rating,
          level: gardener?.experienceLevel?.title || 'Người mới bắt đầu',
          tips: this.generateTipsFromTopPerformer(activityType),
        };
      }),
    );

    return topPerformersDetails;
  }

  /**
   * Phân tích hiệu suất cá nhân một cách chi tiết và khuyến khích
   */
  private async analyzeUserPerformance(
    gardenerId: number,
    currentActivity: any,
    historicalData: any,
  ) {
    const gardener = await this.prisma.gardener.findUnique({
      where: { userId: gardenerId },
      include: {
        experienceLevel: true,
        user: {
          select: {
            firstName: true,
          },
        },
      },
    });

    const userName = gardener?.user.firstName || 'bạn';

    // Đánh giá cấp độ kỹ năng hiện tại
    const currentSkillLevel = this.determineSkillLevel(
      gardener?.experiencePoints || 0,
      historicalData.total,
      historicalData.averageRating,
    );

    // Tính toán tỷ lệ cải thiện
    const improvementRate = this.calculateImprovementRate(historicalData);

    // Phân tích hiệu suất công việc
    const workEfficiency = this.calculateWorkEfficiency(historicalData);

    // Phân tích tiến bộ học tập
    const learningProgress = this.analyzeLearningProgress(
      historicalData,
      userName,
    );

    return {
      currentSkillLevel,
      skillLevelDescription: this.getSkillLevelDescription(
        currentSkillLevel,
        userName,
      ),
      activityExpertise: this.calculateActivityExpertise(historicalData),
      improvementRate,
      workEfficiency,
      learningProgress,
      motivationalMessage: this.generateMotivationalMessage(
        currentSkillLevel,
        improvementRate,
        userName,
      ),
      personalizedTips: this.generatePersonalizedTips(
        currentActivity,
        historicalData,
        userName,
      ),
    };
  }

  /**
   * Tạo ra những dự đoán thông minh và gợi ý hữu ích cho tương lai
   */
  private async generatePredictions(
    gardenerId: number,
    currentActivity: any,
    historicalData: any,
  ) {
    // Dự đoán hoạt động tiếp theo dựa trên thói quen
    const nextActivityPredictions = await this.predictNextActivities(
      gardenerId,
      currentActivity,
      historicalData,
    );

    // Tìm thời điểm tối ưu cho hoạt động tương lai
    const optimalTiming = this.predictOptimalTiming(
      currentActivity,
      historicalData,
    );

    // Dự đoán kết quả có thể đạt được
    const outcomesPrediction = this.predictOutcomes(historicalData);

    return {
      nextActivityPredictions,
      optimalTiming,
      outcomesPrediction,
      aiRecommendations: this.generateAIRecommendations(
        currentActivity,
        historicalData,
      ),
    };
  }

  /**
   * Tạo những thông điệp động viên và khuyến khích cá nhân hóa
   */
  private generateMotivationalMessage(
    skillLevel: UserSkillLevel,
    improvementRate: number,
    userName: string,
  ): string {
    const messages = {
      [UserSkillLevel.BEGINNER]: [
        `Chào ${userName}! Bạn đang trong hành trình tuyệt vời của việc học làm vườn. Mỗi hoạt động đều là một bước tiến quý báu!`,
        `${userName} ơi, đừng lo lắng nếu có lúc chưa hoàn hảo. Những người làm vườn giỏi nhất cũng đều bắt đầu từ những bước đầu tiên như bạn!`,
        `Thật tuyệt vời khi thấy ${userName} bắt đầu hành trình làm vườn! Hãy tiếp tục thử nghiệm và học hỏi nhé.`,
      ],
      [UserSkillLevel.INTERMEDIATE]: [
        `${userName} đang có những tiến bộ rất đáng khen ngợi! Bạn đã nắm được nhiều kỹ thuật cơ bản và đang phát triển phong cách riêng.`,
        `Tuyệt vời ${userName}! Bạn đã vượt qua giai đoạn mới bắt đầu và đang trở thành một người làm vườn có kinh nghiệm.`,
        `${userName} đang ở giai đoạn thú vị nhất - khi đã có nền tảng vững chắc và sẵn sàng khám phá những kỹ thuật nâng cao!`,
      ],
      [UserSkillLevel.ADVANCED]: [
        `${userName} thật xuất sắc! Bạn đã thành thạo nhiều kỹ thuật và có thể chia sẻ kiến thức với những người mới bắt đầu.`,
        `Kỹ năng của ${userName} đã đạt đến mức độ nâng cao. Hãy tiếp tục thử thách bản thân với những dự án phức tạp hơn!`,
        `${userName} đã trở thành một người làm vườn có kinh nghiệm. Những hoạt động của bạn có thể truyền cảm hứng cho nhiều người khác!`,
      ],
      [UserSkillLevel.EXPERT]: [
        `${userName} là một chuyên gia thực thụ! Kinh nghiệm và kỹ năng của bạn là nguồn cảm hứng cho toàn bộ cộng đồng làm vườn.`,
        `Thật tuyệt vời khi có ${userName} trong cộng đồng! Bạn đã đạt đến trình độ chuyên gia và có thể hướng dẫn những người khác.`,
        `${userName} đã chứng minh mình là một bậc thầy trong lĩnh vực làm vườn. Hãy tiếp tục chia sẻ kiến thức quý báu của bạn!`,
      ],
    };

    const levelMessages = messages[skillLevel];
    let selectedMessage =
      levelMessages[Math.floor(Math.random() * levelMessages.length)];

    // Thêm thông điệp về tỷ lệ cải thiện
    if (improvementRate > 20) {
      selectedMessage += ` Đặc biệt, tốc độ tiến bộ ${improvementRate.toFixed(1)}% của bạn thật ấn tượng!`;
    } else if (improvementRate > 10) {
      selectedMessage += ` Bạn đang có sự tiến bộ ổn định với tỷ lệ ${improvementRate.toFixed(1)}%.`;
    } else if (improvementRate > 0) {
      selectedMessage += ` Mặc dù tiến bộ từ từ nhưng bạn vẫn đang phát triển tích cực!`;
    }

    return selectedMessage;
  }

  /**
   * Tạo những lời khuyên cá nhân hóa dựa trên phân tích dữ liệu
   */
  private generatePersonalizedTips(
    currentActivity: any,
    historicalData: any,
    userName: string,
  ): string[] {
    const tips: string[] = [];
    const activityTypeMap = {
      [ActivityType.WATERING]: 'tưới nước',
      [ActivityType.FERTILIZING]: 'bón phân',
      [ActivityType.PRUNING]: 'tỉa cành',
      [ActivityType.PLANTING]: 'trồng cây',
      [ActivityType.HARVESTING]: 'thu hoạch',
      [ActivityType.PEST_CONTROL]: 'phòng trừ sâu bệnh',
      [ActivityType.SOIL_TESTING]: 'kiểm tra đất',
      [ActivityType.WEEDING]: 'làm cỏ',
      [ActivityType.OTHER]: 'chăm sóc chung',
    };

    const activityName =
      activityTypeMap[currentActivity.activityType] || 'làm vườn';

    // Lời khuyên dựa trên tần suất hoạt động
    if (historicalData.frequencyData.weekly < 2) {
      tips.push(
        `${userName} ơi, hãy thử tăng tần suất ${activityName} lên 2-3 lần/tuần để cây phát triển tốt hơn nhé!`,
      );
    } else if (historicalData.frequencyData.weekly > 6) {
      tips.push(
        `${userName} rất chăm chỉ! Tuy nhiên, đôi khi cây cũng cần nghỉ ngơi. Hãy để ý không ${activityName} quá nhiều.`,
      );
    }

    // Lời khuyên dựa trên chất lượng
    if (historicalData.averageRating < 3) {
      tips.push(
        `Đừng nản lòng ${userName}! Hãy thử quan sát kỹ hơn phản ứng của cây sau mỗi lần ${activityName} để cải thiện kỹ thuật.`,
      );
    } else if (historicalData.averageRating >= 4) {
      tips.push(
        `${userName} đã làm rất tốt với việc ${activityName}! Có thể bạn muốn thử thách bản thân với những kỹ thuật nâng cao hơn.`,
      );
    }

    // Lời khuyên dựa trên thời gian trong ngày
    const recentActivities = historicalData.activities.slice(0, 10);
    const morningActivities = recentActivities.filter(
      (a) =>
        new Date(a.timestamp).getHours() >= 6 &&
        new Date(a.timestamp).getHours() <= 10,
    ).length;

    if (morningActivities < recentActivities.length * 0.3) {
      tips.push(
        `${userName} có thể thử ${activityName} vào buổi sáng sớm (6-10h) để tận dụng thời tiết mát mẻ và hiệu quả cao nhất.`,
      );
    }

    // Lời khuyên theo mùa (dựa trên thời gian hiện tại)
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 6 && currentMonth <= 8) {
      // Mùa hè
      tips.push(
        `Trong mùa hè này, ${userName} nên ${activityName} vào sáng sớm hoặc chiều muộn để tránh nắng gắt và bảo vệ cây.`,
      );
    } else if (currentMonth >= 12 || currentMonth <= 2) {
      // Mùa đông
      tips.push(
        `Mùa đông là thời điểm đặc biệt, ${userName} hãy điều chỉnh cách ${activityName} cho phù hợp với thời tiết lạnh nhé.`,
      );
    }

    return tips.slice(0, 3); // Chỉ trả về 3 lời khuyên quan trọng nhất
  }

  /**
   * Các phương thức hỗ trợ với ngôn ngữ thân thiện
   */

  private getSkillLevelDescription(
    level: UserSkillLevel,
    userName: string,
  ): string {
    const descriptions = {
      [UserSkillLevel.BEGINNER]: `${userName} đang ở giai đoạn khám phá và học hỏi những điều cơ bản nhất về làm vườn. Đây là thời điểm tuyệt vời để thử nghiệm và không ngại mắc lỗi!`,
      [UserSkillLevel.INTERMEDIATE]: `${userName} đã nắm vững những kỹ thuật cơ bản và đang phát triển phong cách làm vườn riêng. Bạn có thể tự tin xử lý hầu hết các tình huống thường gặp.`,
      [UserSkillLevel.ADVANCED]: `${userName} đã trở thành một người làm vườn có kinh nghiệm với khả năng xử lý các vấn đề phức tạp và áp dụng nhiều kỹ thuật nâng cao.`,
      [UserSkillLevel.EXPERT]: `${userName} là một chuyên gia thực thụ trong lĩnh vực làm vườn, có thể hướng dẫn người khác và xử lý mọi thách thức một cách tự tin.`,
    };

    return descriptions[level];
  }

  private generateHistoricalInsights(
    activities: any[],
    activitiesByPeriod: any,
    averageRating: number,
  ): string[] {
    const insights: string[] = [];

    // Phân tích xu hướng hoạt động
    const recentTrend =
      activitiesByPeriod.last7Days.length -
      activitiesByPeriod.last30Days.length / 4;
    if (recentTrend > 0) {
      insights.push(
        'Bạn đang tăng tần suất hoạt động trong thời gian gần đây - điều này thật tuyệt vời!',
      );
    } else if (recentTrend < -1) {
      insights.push(
        'Có vẻ như bạn ít hoạt động hơn gần đây. Đừng lo, hãy từ từ quay lại nhịp độ nhé!',
      );
    }

    // Phân tích chất lượng
    if (averageRating >= 4) {
      insights.push(
        'Chất lượng hoạt động của bạn rất ấn tượng! Bạn đang làm đúng hướng.',
      );
    } else if (averageRating >= 3) {
      insights.push(
        'Bạn đang có sự tiến bộ ổn định. Hãy tiếp tục duy trì và cải thiện thêm!',
      );
    } else {
      insights.push(
        'Đây là cơ hội tuyệt vời để học hỏi và cải thiện. Mọi chuyên gia đều từng trải qua giai đoạn này!',
      );
    }

    // Phân tích tính nhất quán
    if (activities.length >= 10) {
      insights.push(
        'Tính kiên trì của bạn thật đáng khen ngợi! Sự nhất quán là chìa khóa thành công trong làm vườn.',
      );
    }

    return insights;
  }

  private generateCommunityInsights(
    totalActivities: number,
    averageRating: number,
  ): string[] {
    const insights: string[] = [];

    insights.push(
      `Cộng đồng của chúng ta có ${totalActivities.toLocaleString('vi-VN')} hoạt động cùng loại trong 3 tháng qua - thật sôi động!`,
    );

    insights.push(
      `Điểm đánh giá trung bình của cộng đồng là ${averageRating.toFixed(1)}/5. Đây là mức chuẩn để bạn so sánh và phấn đấu.`,
    );

    if (averageRating >= 4) {
      insights.push(
        'Cộng đồng của chúng ta có chất lượng hoạt động rất cao - bạn đang học hỏi từ những người xuất sắc!',
      );
    }

    return insights;
  }

  private generateTipsFromTopPerformer(activityType: ActivityType): string[] {
    const tipsByActivity = {
      [ActivityType.WATERING]: [
        'Tưới nước vào buổi sáng sớm để giảm bốc hơi',
        'Kiểm tra độ ẩm đất bằng ngón tay trước khi tưới',
        'Tưới chậm và sâu thay vì nhanh và nông',
      ],
      [ActivityType.FERTILIZING]: [
        'Bón phân sau khi tưới nước để dinh dưỡng thấm sâu',
        'Sử dụng phân hữu cơ kết hợp với phân vô cơ',
        'Bón phân vào buổi chiều để tránh bỏng lá',
      ],
      [ActivityType.PRUNING]: [
        'Dùng kéo sắc bén và khử trùng để tránh nhiễm bệnh',
        'Tỉa cành vào buổi sáng khi cây đầy sức sống',
        'Cắt xiên 45 độ phía trên chồi để nước không đọng',
      ],
      [ActivityType.PLANTING]: [
        'Chọn thời điểm trồng phù hợp với từng loại cây',
        'Chuẩn bị đất kỹ lưỡng trước khi trồng',
        'Tưới nước nhẹ nhàng sau khi trồng',
      ],
      [ActivityType.PEST_CONTROL]: [
        'Kiểm tra cây thường xuyên để phát hiện sớm',
        'Sử dụng biện pháp sinh học trước khi dùng thuốc',
        'Xịt thuốc vào buổi chiều để tránh bỏng lá',
      ],
    };

    return (
      tipsByActivity[activityType] || [
        'Quan sát cây thường xuyên để hiểu nhu cầu',
        'Ghi chép lại kết quả để rút kinh nghiệm',
        'Học hỏi từ cộng đồng và chia sẻ kinh nghiệm',
      ]
    );
  }

  private generateAIRecommendations(
    currentActivity: any,
    historicalData: any,
  ): string[] {
    const recommendations: string[] = [];

    // Dựa trên AI phân tích mẫu hành vi
    if (historicalData.averageRating < 3.5) {
      recommendations.push(
        'AI gợi ý: Hãy thử ghi chép chi tiết hơn về điều kiện thời tiết và phản ứng của cây để tìm ra quy luật tối ưu.',
      );
    }

    if (historicalData.frequencyData.weekly < 2) {
      recommendations.push(
        'AI khuyến nghị: Tăng tần suất hoạt động sẽ giúp bạn có thêm kinh nghiệm và cây phát triển tốt hơn.',
      );
    }

    recommendations.push(
      'AI dự đoán: Dựa trên phân tích dữ liệu, hoạt động tiếp theo của bạn có khả năng thành công cao nếu thực hiện vào buổi sáng.',
    );

    return recommendations;
  }

  // Các phương thức tính toán vẫn giữ nguyên logic nhưng có thêm mô tả tiếng Việt
  private calculateAverageRating(activities: any[]): number {
    const ratings = activities
      .flatMap((a) => a.evaluations)
      .filter((e) => e.rating !== null)
      .map((e) => e.rating);

    return ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 3.0; // Giá trị mặc định trung tính
  }

  private calculateFrequencyData(activities: any[]) {
    const now = new Date();
    const periods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };

    const frequencyData = {};

    Object.entries(periods).forEach(([period, days]) => {
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const count = activities.filter((a) => a.timestamp >= startDate).length;
      frequencyData[period] = count;
    });

    return frequencyData;
  }

  private calculatePerformanceTrend(activities: any[]): TrendDirection {
    if (activities.length < 4) return TrendDirection.STABLE;

    const recentActivities = activities.slice(
      0,
      Math.floor(activities.length / 2),
    );
    const olderActivities = activities.slice(Math.floor(activities.length / 2));

    const recentAvg = this.calculateAverageRating(recentActivities);
    const olderAvg = this.calculateAverageRating(olderActivities);

    const difference = recentAvg - olderAvg;

    if (difference > 0.3) return TrendDirection.IMPROVING;
    if (difference < -0.3) return TrendDirection.DECLINING;
    return TrendDirection.STABLE;
  }

  private determineSkillLevel(
    experiencePoints: number,
    totalActivities: number,
    averageRating: number,
  ): UserSkillLevel {
    // Tính điểm tổng hợp từ nhiều yếu tố
    const experienceScore = Math.min(experiencePoints / 10, 50); // Tối đa 50 điểm
    const activityScore = Math.min(totalActivities * 2, 30); // Tối đa 30 điểm
    const qualityScore = averageRating * 4; // Tối đa 20 điểm

    const totalScore = experienceScore + activityScore + qualityScore;

    if (totalScore >= 80) return UserSkillLevel.EXPERT;
    if (totalScore >= 60) return UserSkillLevel.ADVANCED;
    if (totalScore >= 35) return UserSkillLevel.INTERMEDIATE;
    return UserSkillLevel.BEGINNER;
  }

  private calculateActivityExpertise(historicalData: any): number {
    const experiencePoints = Math.min(historicalData.total * 3, 60); // Kinh nghiệm từ số lượng
    const qualityPoints = historicalData.averageRating * 8; // Chất lượng
    const consistencyBonus =
      this.calculateConsistency(historicalData.activities) * 2; // Tính nhất quán

    return Math.min(experiencePoints + qualityPoints + consistencyBonus, 100);
  }

  private calculateImprovementRate(historicalData: any): number {
    if (historicalData.activities.length < 6) return 0;

    const splitPoint = Math.floor(historicalData.activities.length / 2);
    const recentActivities = historicalData.activities.slice(0, splitPoint);
    const olderActivities = historicalData.activities.slice(splitPoint);

    const recentAvg = this.calculateAverageRating(recentActivities);
    const olderAvg = this.calculateAverageRating(olderActivities);

    if (olderAvg === 0) return 0;

    const improvementRate = ((recentAvg - olderAvg) / olderAvg) * 100;
    return Math.round(improvementRate * 10) / 10; // Làm tròn đến 1 chữ số thập phân
  }

  private calculateWorkEfficiency(historicalData: any) {
    const baseEfficiency = Math.min(historicalData.total * 1.5, 70);
    const qualityMultiplier = historicalData.averageRating / 5;
    const improvementRate = this.calculateImprovementRate(historicalData);

    return {
      speedRating: Math.min(baseEfficiency / 14, 5),
      accuracyRating: Math.min(historicalData.averageRating, 5),
      consistencyRating: this.calculateConsistency(historicalData.activities),
      innovationRating: Math.min(3 + (improvementRate > 15 ? 1 : 0), 5),
      speedImprovement: Math.max(0, improvementRate),
      accuracyImprovement: Math.max(0, improvementRate),
      overallImprovement: Math.max(0, improvementRate),
    };
  }

  private calculateConsistency(activities: any[]): number {
    if (activities.length < 3) return 3;

    const ratings = activities
      .flatMap((a) => a.evaluations)
      .filter((e) => e.rating !== null)
      .map((e) => e.rating);

    if (ratings.length === 0) return 3;

    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance =
      ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) /
      ratings.length;
    const standardDeviation = Math.sqrt(variance);

    // Chuyển đổi sang thang điểm 1-5 (5 = rất nhất quán, 1 = không nhất quán)
    const consistencyScore = Math.max(1, 5 - standardDeviation * 1.5);
    return Math.round(consistencyScore * 10) / 10;
  }

  private analyzeLearningProgress(historicalData: any, userName: string) {
    return {
      mistakesMade: this.identifyCommonMistakes(historicalData, userName),
      lessonsLearned: this.extractLessonsLearned(historicalData, userName),
      skillsImproved: this.identifyImprovedSkills(historicalData, userName),
      nextSkillToLearn: this.suggestNextSkill(historicalData, userName),
    };
  }

  private identifyCommonMistakes(
    historicalData: any,
    userName: string,
  ): string[] {
    const lowRatedActivities = historicalData.activities.filter((a) =>
      a.evaluations.some((e) => e.rating && e.rating < 3),
    );

    const mistakes: string[] = [];

    if (lowRatedActivities.length > 0) {
      const lowRatePercentage =
        (lowRatedActivities.length / historicalData.activities.length) * 100;

      if (lowRatePercentage > 30) {
        mistakes.push(
          `${userName} thường gặp khó khăn khi thực hiện vào những thời điểm không phù hợp trong ngày`,
        );
        mistakes.push(
          `Có vẻ như ${userName} cần chú ý thêm về lượng nước hoặc phân bón sử dụng`,
        );
      } else if (lowRatePercentage > 15) {
        mistakes.push(
          `${userName} đôi khi chưa chọn được thời điểm tối ưu để thực hiện hoạt động`,
        );
      }
    }

    // Phân tích theo thời gian trong ngày
    const badTimingActivities = lowRatedActivities.filter((a) => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 11 && hour <= 15; // Trưa nắng gắt
    });

    if (badTimingActivities.length > 0) {
      mistakes.push(
        `${userName} nên tránh làm vườn vào giữa trưa khi nắng gắt`,
      );
    }

    return mistakes.slice(0, 3); // Tối đa 3 lỗi phổ biến
  }

  private extractLessonsLearned(
    historicalData: any,
    userName: string,
  ): string[] {
    const lessons: string[] = [];

    if (historicalData.averageRating >= 4) {
      lessons.push(
        `${userName} đã học được cách chọn thời điểm tối ưu để thực hiện hoạt động`,
      );
      lessons.push(
        `${userName} đã nắm vững được nhu cầu và phản ứng của cây trồng`,
      );
    } else if (historicalData.averageRating >= 3.5) {
      lessons.push(
        `${userName} đang dần hiểu rõ hơn về quy trình chăm sóc cây`,
      );
    }

    if (historicalData.total >= 15) {
      lessons.push(
        `${userName} đã tích lũy được kinh nghiệm thực tế quý báu từ nhiều lần thực hành`,
      );
    }

    if (this.calculateImprovementRate(historicalData) > 10) {
      lessons.push(
        `${userName} đã học được cách cải thiện hiệu quả thông qua việc rút kinh nghiệm`,
      );
    }

    return lessons.slice(0, 4); // Tối đa 4 bài học
  }

  private identifyImprovedSkills(
    historicalData: any,
    userName: string,
  ): string[] {
    const skills: string[] = [];
    const improvementRate = this.calculateImprovementRate(historicalData);

    if (improvementRate > 20) {
      skills.push(
        `${userName} đã cải thiện đáng kể kỹ thuật thực hiện hoạt động`,
      );
      skills.push(
        `Khả năng chọn thời điểm phù hợp của ${userName} đã tiến bộ rõ rệt`,
      );
      skills.push(
        `${userName} đã phát triển khả năng quan sát và đánh giá tình trạng cây`,
      );
    } else if (improvementRate > 10) {
      skills.push(`${userName} đang cải thiện ổn định kỹ năng làm vườn`);
      skills.push(`Hiểu biết về cây trồng của ${userName} đã được nâng cao`);
    } else if (improvementRate > 0) {
      skills.push(`${userName} đang có sự tiến bộ từ từ nhưng chắc chắn`);
    }

    return skills;
  }

  private suggestNextSkill(historicalData: any, userName: string): string {
    const currentLevel = this.determineSkillLevel(
      0,
      historicalData.total,
      historicalData.averageRating,
    );

    const suggestions = {
      [UserSkillLevel.BEGINNER]: `${userName} nên tập trung vào việc hiểu rõ nhu cầu cơ bản của cây trồng`,
      [UserSkillLevel.INTERMEDIATE]: `${userName} có thể học thêm về các kỹ thuật chăm sóc nâng cao và quản lý chu kỳ sinh trưởng`,
      [UserSkillLevel.ADVANCED]: `${userName} nên thử nghiệm với các phương pháp làm vườn sáng tạo và bền vững`,
      [UserSkillLevel.EXPERT]: `${userName} có thể chia sẻ kiến thức và hướng dẫn những người mới bắt đầu trong cộng đồng`,
    };

    return suggestions[currentLevel];
  }

  // Tiếp tục với các phương thức dự đoán...
  private async predictNextActivities(
    gardenerId: number,
    currentActivity: any,
    historicalData: any,
  ) {
    const activitySequences = await this.prisma.gardenActivity.findMany({
      where: {
        gardenerId,
        timestamp: {
          gte: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 tháng qua
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        activityType: true,
        timestamp: true,
      },
    });

    const commonNextActivities = this.analyzeActivitySequences(
      activitySequences,
      currentActivity.activityType,
    );

    return commonNextActivities.map((activity) => ({
      activityType: activity.type,
      probability: activity.probability,
      recommendedDate: this.calculateRecommendedDate(
        activity.type,
        activity.averageInterval,
      ),
      reasoning: this.generateDetailedReasoning(activity.type, currentActivity),
      confidence: this.determineConfidence(activity.probability),
      friendlyDescription: this.getFriendlyActivityDescription(
        activity.type,
        activity.probability,
      ),
    }));
  }

  private generateDetailedReasoning(
    activityType: ActivityType,
    currentActivity: any,
  ): string[] {
    const activityNames = {
      [ActivityType.WATERING]: 'tưới nước',
      [ActivityType.FERTILIZING]: 'bón phân',
      [ActivityType.PRUNING]: 'tỉa cành',
      [ActivityType.PLANTING]: 'trồng cây',
      [ActivityType.HARVESTING]: 'thu hoạch',
      [ActivityType.PEST_CONTROL]: 'phòng trừ sâu bệnh',
      [ActivityType.SOIL_TESTING]: 'kiểm tra đất',
      [ActivityType.WEEDING]: 'làm cỏ',
      [ActivityType.OTHER]: 'chăm sóc khác',
    };

    const currentName =
      activityNames[currentActivity.activityType] || 'hoạt động hiện tại';
    const nextName = activityNames[activityType] || 'hoạt động tiếp theo';

    const reasons: string[] = [];

    // Logic dựa trên loại hoạt động hiện tại và tiếp theo
    if (
      currentActivity.activityType === ActivityType.WATERING &&
      activityType === ActivityType.FERTILIZING
    ) {
      reasons.push(
        `Sau khi ${currentName}, đất đã ẩm và là thời điểm lý tưởng để ${nextName}`,
      );
      reasons.push(
        'Cây sẽ hấp thụ dinh dưỡng tốt hơn khi đất có độ ẩm phù hợp',
      );
      reasons.push(
        'Đây là chu trình chăm sóc được nhiều người làm vườn áp dụng',
      );
    } else if (
      currentActivity.activityType === ActivityType.FERTILIZING &&
      activityType === ActivityType.WATERING
    ) {
      reasons.push(
        `Sau khi ${currentName}, cần ${nextName} nhẹ để dinh dưỡng thấm sâu vào đất`,
      );
      reasons.push(
        'Việc này giúp phân bón hòa tan và được cây hấp thụ hiệu quả',
      );
    } else if (activityType === ActivityType.PEST_CONTROL) {
      reasons.push(
        `Theo lịch chăm sóc định kỳ, đây là lúc nên kiểm tra và ${nextName}`,
      );
      reasons.push(
        'Phòng bệnh luôn tốt hơn chữa bệnh, đặc biệt sau các hoạt động chăm sóc',
      );
    } else if (activityType === ActivityType.PRUNING) {
      reasons.push(
        `Cây đang phát triển tốt sau ${currentName}, đây là thời điểm phù hợp để ${nextName}`,
      );
      reasons.push(
        'Việc tỉa cành giúp cây tập trung dinh dưỡng vào những phần quan trọng',
      );
    } else {
      reasons.push(
        `Dựa trên lịch sử hoạt động, bạn thường ${nextName} sau khi ${currentName}`,
      );
      reasons.push(
        `Đây là chu trình chăm sóc hiệu quả mà bạn đã áp dụng thành công`,
      );
      reasons.push(
        'Việc duy trì nhịp độ đều đặn sẽ giúp cây phát triển tốt nhất',
      );
    }

    return reasons;
  }

  private getFriendlyActivityDescription(
    activityType: ActivityType,
    probability: number,
  ): string {
    const descriptions = {
      [ActivityType.WATERING]: 'tưới nước cho cây',
      [ActivityType.FERTILIZING]: 'bổ sung dinh dưỡng cho cây',
      [ActivityType.PRUNING]: 'tỉa cành để cây phát triển đều',
      [ActivityType.PLANTING]: 'trồng thêm cây mới',
      [ActivityType.HARVESTING]: 'thu hoạch thành quả',
      [ActivityType.PEST_CONTROL]: 'kiểm tra và phòng trừ sâu bệnh',
      [ActivityType.SOIL_TESTING]: 'kiểm tra chất lượng đất',
      [ActivityType.WEEDING]: 'dọn cỏ dại',
      [ActivityType.OTHER]: 'chăm sóc tổng quát',
    };

    const activity = descriptions[activityType] || 'hoạt động làm vườn';
    const confidence =
      probability >= 0.7
        ? 'rất có khả năng'
        : probability >= 0.4
          ? 'có thể'
          : 'cũng nên xem xét';

    return `Bạn ${confidence} sẽ cần ${activity} trong thời gian tới`;
  }

  private predictOptimalTiming(currentActivity: any, historicalData: any) {
    const successfulActivities = historicalData.activities.filter((a) =>
      a.evaluations.some((e) => e.rating && e.rating >= 4),
    );

    // Phân tích giờ trong ngày
    const optimalHours = successfulActivities.map((a) =>
      new Date(a.timestamp).getHours(),
    );

    // Phân tích ngày trong tuần
    const optimalDays = successfulActivities.map((a) =>
      new Date(a.timestamp).getDay(),
    );

    const mostCommonHour = this.findMostCommon(optimalHours) || 7;
    const mostCommonDay = this.findMostCommon(optimalDays) || 1; // Thứ 2

    const confidenceLevel =
      successfulActivities.length >= 10
        ? PredictionConfidence.HIGH
        : successfulActivities.length >= 5
          ? PredictionConfidence.MEDIUM
          : PredictionConfidence.LOW;

    return {
      nextOptimalDate: this.calculateOptimalDate(mostCommonDay),
      optimalTimeOfDay: mostCommonHour,
      optimalTimeDescription: this.getTimeDescription(mostCommonHour),
      optimalWeatherConditions: this.getOptimalWeatherConditions(
        currentActivity.activityType,
      ),
      confidenceLevel,
      factors: this.getTimingFactors(
        successfulActivities.length,
        mostCommonHour,
      ),
      friendlyExplanation: this.generateTimingExplanation(
        mostCommonHour,
        confidenceLevel,
      ),
    };
  }

  private getTimeDescription(hour: number): string {
    if (hour >= 5 && hour <= 8) return 'sáng sớm (5-8h)';
    if (hour >= 9 && hour <= 11) return 'sáng muộn (9-11h)';
    if (hour >= 12 && hour <= 14) return 'trưa (12-14h)';
    if (hour >= 15 && hour <= 17) return 'chiều (15-17h)';
    if (hour >= 18 && hour <= 20) return 'chiều muộn (18-20h)';
    return 'tối (sau 20h)';
  }

  private getOptimalWeatherConditions(activityType: ActivityType): string[] {
    const generalConditions = [
      'Nhiệt độ ôn hòa (20-28°C)',
      'Độ ẩm không khí vừa phải (60-80%)',
      'Không có gió mạnh',
    ];

    const specificConditions = {
      [ActivityType.WATERING]: [
        'Không mưa trong 2-3 giờ tới',
        'Trời không nắng gắt',
      ],
      [ActivityType.FERTILIZING]: [
        'Đất ẩm nhưng không ngập nước',
        'Trời râm mát',
      ],
      [ActivityType.PRUNING]: [
        'Trời khô ráo để vết cắt nhanh lành',
        'Ánh sáng tốt để quan sát',
      ],
      [ActivityType.PEST_CONTROL]: [
        'Không có mưa trong 6-8 giờ tới',
        'Gió nhẹ để thuốc không bay xa',
      ],
    };

    return [
      ...generalConditions,
      ...(specificConditions[activityType] || ['Thời tiết ổn định']),
    ];
  }

  private getTimingFactors(
    successfulCount: number,
    optimalHour: number,
  ): string[] {
    const factors: string[] = [];

    if (successfulCount >= 10) {
      factors.push('Phân tích từ nhiều hoạt động thành công của bạn');
    } else if (successfulCount >= 5) {
      factors.push('Dựa trên một số hoạt động hiệu quả trước đây');
    } else {
      factors.push('Kết hợp kinh nghiệm của bạn và khuyến nghị chung');
    }

    if (optimalHour >= 6 && optimalHour <= 9) {
      factors.push('Buổi sáng là thời điểm cây hấp thụ tốt nhất');
      factors.push('Nhiệt độ và độ ẩm lý tưởng vào buổi sáng');
    } else if (optimalHour >= 16 && optimalHour <= 18) {
      factors.push('Buổi chiều muộn giúp tránh nắng gắt');
      factors.push('Cây có thời gian phục hồi qua đêm');
    }

    factors.push('Dự báo thời tiết thuận lợi cho hoạt động');

    return factors;
  }

  private generateTimingExplanation(
    optimalHour: number,
    confidence: PredictionConfidence,
  ): string {
    const timeDesc = this.getTimeDescription(optimalHour);
    const confidenceText = {
      [PredictionConfidence.HIGH]: 'rất tin tưởng',
      [PredictionConfidence.MEDIUM]: 'khá tin tưởng',
      [PredictionConfidence.LOW]: 'gợi ý dựa trên kinh nghiệm chung',
    };

    return `Dựa trên phân tích dữ liệu, chúng tôi ${confidenceText[confidence]} rằng ${timeDesc} sẽ là thời điểm tối ưu nhất cho hoạt động tiếp theo của bạn. Thời gian này thường mang lại hiệu quả cao nhất dựa trên lịch sử thành công của bạn.`;
  }

  private predictOutcomes(historicalData: any) {
    const recentSuccessRate = this.calculateRecentSuccessRate(historicalData);
    const qualityTrend = this.calculatePerformanceTrend(
      historicalData.activities,
    );

    // Điều chỉnh dự đoán dựa trên xu hướng
    let adjustedSuccessRate = recentSuccessRate;
    if (qualityTrend === TrendDirection.IMPROVING) {
      adjustedSuccessRate = Math.min(recentSuccessRate + 10, 95);
    } else if (qualityTrend === TrendDirection.DECLINING) {
      adjustedSuccessRate = Math.max(recentSuccessRate - 5, 60);
    }

    return {
      expectedSuccessRate: Math.round(adjustedSuccessRate),
      predictedQuality: Math.round(
        Math.min(historicalData.averageRating * 22, 90),
      ),
      predictedEfficiency: Math.round(Math.min(adjustedSuccessRate + 5, 92)),
      riskFactors: this.identifyDetailedRiskFactors(historicalData),
      successFactors: this.identifyDetailedSuccessFactors(historicalData),
      outcomeExplanation: this.generateOutcomeExplanation(
        adjustedSuccessRate,
        qualityTrend,
      ),
    };
  }

  private identifyDetailedRiskFactors(historicalData: any): string[] {
    const factors: string[] = [];

    if (historicalData.averageRating < 3) {
      factors.push(
        'Kỹ năng còn cần được rèn luyện thêm - hãy tham khảo thêm tài liệu hướng dẫn',
      );
    }

    const improvementRate = this.calculateImprovementRate(historicalData);
    if (improvementRate < -5) {
      factors.push(
        'Hiệu suất đang có xu hướng giảm - có thể do stress hoặc thiếu động lực',
      );
    }

    if (historicalData.frequencyData.weekly < 1) {
      factors.push(
        'Tần suất hoạt động thấp có thể ảnh hưởng đến việc duy trì kỹ năng',
      );
    }

    // Kiểm tra thời tiết và mùa
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 6 && currentMonth <= 8) {
      factors.push(
        'Thời tiết mùa hè có thể gây khó khăn - cần chú ý thời điểm thực hiện',
      );
    } else if (currentMonth >= 12 || currentMonth <= 2) {
      factors.push(
        'Thời tiết mùa đông có thể ảnh hưởng đến sự phát triển của cây',
      );
    }

    factors.push(
      'Yếu tố thời tiết bất ngờ luôn có thể xảy ra - nên có kế hoạch dự phòng',
    );

    return factors.slice(0, 4); // Tối đa 4 yếu tố rủi ro chính
  }

  private identifyDetailedSuccessFactors(historicalData: any): string[] {
    const factors: string[] = [];

    if (historicalData.averageRating >= 4) {
      factors.push(
        'Bạn đã có kinh nghiệm tốt và hiểu rõ cách thực hiện hiệu quả',
      );
    }

    if (historicalData.total >= 10) {
      factors.push(
        'Số lượng hoạt động đã thực hiện cho thấy sự kiên trì và tích lũy kinh nghiệm',
      );
    }

    const improvementRate = this.calculateImprovementRate(historicalData);
    if (improvementRate > 10) {
      factors.push(
        'Xu hướng cải thiện tích cực cho thấy bạn đang học hỏi hiệu quả',
      );
    }

    const consistency = this.calculateConsistency(historicalData.activities);
    if (consistency >= 4)
      if (consistency >= 4) {
        factors.push(
          'Tính nhất quán cao trong chất lượng thực hiện các hoạt động',
        );
      }

    factors.push('Kiến thức cơ bản đã được nắm vững qua quá trình thực hành');
    factors.push('Thái độ học hỏi tích cực và sẵn sàng cải thiện');

    // Thêm yếu tố theo mùa hiện tại
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 3 && currentMonth <= 5) {
      factors.push(
        'Mùa xuân là thời điểm lý tưởng cho hầu hết hoạt động làm vườn',
      );
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      factors.push(
        'Mùa thu có thời tiết ôn hòa, thuận lợi cho việc chăm sóc cây',
      );
    }

    return factors.slice(0, 5); // Tối đa 5 yếu tố thành công
  }

  private generateOutcomeExplanation(
    successRate: number,
    trend: TrendDirection,
  ): string {
    let explanation = '';

    if (successRate >= 90) {
      explanation = 'Bạn có khả năng rất cao để đạt được kết quả xuất sắc! ';
    } else if (successRate >= 80) {
      explanation =
        'Khả năng thành công của bạn ở mức tốt, hãy tự tin thực hiện! ';
    } else if (successRate >= 70) {
      explanation =
        'Bạn có cơ hội thành công khá cao, chỉ cần chú ý một số chi tiết. ';
    } else {
      explanation =
        'Đây là cơ hội tốt để học hỏi và cải thiện, đừng lo lắng về kết quả! ';
    }

    switch (trend) {
      case TrendDirection.IMPROVING:
        explanation +=
          'Xu hướng cải thiện liên tục của bạn là dấu hiệu rất tích cực cho hoạt động tiếp theo.';
        break;
      case TrendDirection.STABLE:
        explanation +=
          'Hiệu suất ổn định của bạn cho thấy sự chín chắn trong kỹ năng làm vườn.';
        break;
      case TrendDirection.DECLINING:
        explanation +=
          'Mặc dù có chút suy giảm gần đây, nhưng đây chỉ là giai đoạn tạm thời. Hãy tự tin!';
        break;
    }

    return explanation;
  }

  // Các phương thức hỗ trợ khác

  private calculateOptimalDate(preferredDay: number): Date {
    const today = new Date();
    const currentDay = today.getDay();
    let daysToAdd = preferredDay - currentDay;

    if (daysToAdd <= 0) {
      daysToAdd += 7; // Tuần tiếp theo
    }

    const optimalDate = new Date(today);
    optimalDate.setDate(today.getDate() + daysToAdd);

    return optimalDate;
  }

  private calculateRecentSuccessRate(historicalData: any): number {
    const recentActivities = historicalData.activities.slice(
      0,
      Math.min(15, historicalData.activities.length),
    );

    if (recentActivities.length === 0) return 75; // Giá trị mặc định tích cực

    const successfulCount = recentActivities.filter((a) =>
      a.evaluations.some((e) => e.rating && e.rating >= 4),
    ).length;

    const successRate = (successfulCount / recentActivities.length) * 100;
    return Math.max(60, successRate); // Tối thiểu 60% để động viên
  }

  private analyzeActivitySequences(
    sequences: any[],
    currentType: ActivityType,
  ) {
    const nextActivities = new Map<
      ActivityType,
      { count: number; intervals: number[]; ratings: number[] }
    >();

    // Phân tích chuỗi hoạt động
    for (let i = 0; i < sequences.length - 1; i++) {
      if (sequences[i].activityType === currentType) {
        const nextActivity = sequences[i + 1];
        const interval =
          Math.abs(
            new Date(nextActivity.timestamp).getTime() -
              new Date(sequences[i].timestamp).getTime(),
          ) /
          (1000 * 60 * 60 * 24); // Tính theo ngày

        if (!nextActivities.has(nextActivity.activityType)) {
          nextActivities.set(nextActivity.activityType, {
            count: 0,
            intervals: [],
            ratings: [],
          });
        }

        const data = nextActivities.get(nextActivity.activityType)!;
        data.count++;
        data.intervals.push(interval);
      }
    }

    const total = Array.from(nextActivities.values()).reduce(
      (sum, data) => sum + data.count,
      0,
    );

    if (total === 0) {
      // Nếu không có dữ liệu lịch sử, đưa ra gợi ý mặc định
      return this.getDefaultActivitySuggestions(currentType);
    }

    return Array.from(nextActivities.entries())
      .map(([type, data]) => ({
        type,
        probability: data.count / total,
        averageInterval:
          data.intervals.reduce((sum, i) => sum + i, 0) / data.intervals.length,
        frequency: data.count,
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3); // Top 3 hoạt động có khả năng cao nhất
  }

  private getDefaultActivitySuggestions(currentType: ActivityType) {
    // Gợi ý mặc định dựa trên kiến thức làm vườn
    const defaultSequences = {
      [ActivityType.WATERING]: [
        {
          type: ActivityType.FERTILIZING,
          probability: 0.6,
          averageInterval: 1,
          frequency: 1,
        },
        {
          type: ActivityType.PEST_CONTROL,
          probability: 0.3,
          averageInterval: 3,
          frequency: 1,
        },
        {
          type: ActivityType.PRUNING,
          probability: 0.1,
          averageInterval: 7,
          frequency: 1,
        },
      ],
      [ActivityType.FERTILIZING]: [
        {
          type: ActivityType.WATERING,
          probability: 0.8,
          averageInterval: 0.5,
          frequency: 1,
        },
        {
          type: ActivityType.SOIL_TESTING,
          probability: 0.2,
          averageInterval: 14,
          frequency: 1,
        },
      ],
      [ActivityType.PRUNING]: [
        {
          type: ActivityType.WATERING,
          probability: 0.7,
          averageInterval: 1,
          frequency: 1,
        },
        {
          type: ActivityType.FERTILIZING,
          probability: 0.3,
          averageInterval: 2,
          frequency: 1,
        },
      ],
      [ActivityType.PLANTING]: [
        {
          type: ActivityType.WATERING,
          probability: 0.9,
          averageInterval: 0.5,
          frequency: 1,
        },
        {
          type: ActivityType.SOIL_TESTING,
          probability: 0.1,
          averageInterval: 1,
          frequency: 1,
        },
      ],
      [ActivityType.PEST_CONTROL]: [
        {
          type: ActivityType.WATERING,
          probability: 0.5,
          averageInterval: 1,
          frequency: 1,
        },
        {
          type: ActivityType.PRUNING,
          probability: 0.3,
          averageInterval: 2,
          frequency: 1,
        },
        {
          type: ActivityType.FERTILIZING,
          probability: 0.2,
          averageInterval: 3,
          frequency: 1,
        },
      ],
    };

    return (
      defaultSequences[currentType] || [
        {
          type: ActivityType.WATERING,
          probability: 0.6,
          averageInterval: 2,
          frequency: 1,
        },
        {
          type: ActivityType.PEST_CONTROL,
          probability: 0.4,
          averageInterval: 7,
          frequency: 1,
        },
      ]
    );
  }

  private calculateRecommendedDate(
    activityType: ActivityType,
    averageInterval: number,
  ): Date {
    const now = new Date();
    const daysToAdd = Math.max(1, Math.round(averageInterval)); // Tối thiểu 1 ngày

    const recommendedDate = new Date(
      now.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
    );

    // Điều chỉnh để tránh các ngày không phù hợp (ví dụ: chủ nhật cho một số hoạt động)
    if (
      recommendedDate.getDay() === 0 &&
      this.shouldAvoidSunday(activityType)
    ) {
      recommendedDate.setDate(recommendedDate.getDate() + 1); // Chuyển sang thứ 2
    }

    return recommendedDate;
  }

  private shouldAvoidSunday(activityType: ActivityType): boolean {
    // Một số hoạt động có thể không phù hợp vào chủ nhật
    const avoidSundayActivities: ActivityType[] = [
      ActivityType.FERTILIZING,
      ActivityType.PEST_CONTROL,
    ];

    return avoidSundayActivities.includes(activityType);
  }

  private determineConfidence(probability: number): PredictionConfidence {
    if (probability >= 0.7) return PredictionConfidence.HIGH;
    if (probability >= 0.4) return PredictionConfidence.MEDIUM;
    return PredictionConfidence.LOW;
  }

  private findMostCommon(array: number[]): number | null {
    if (array.length === 0) return null;

    const frequency = new Map<number, number>();
    array.forEach((item) => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    let maxCount = 0;
    let mostCommon = array[0];

    frequency.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });

    return mostCommon;
  }

  /**
   * Phương thức hỗ trợ lấy thống kê nhanh cho dashboard
   * @param gardenerId ID người làm vườn
   * @returns Thống kê tổng quan nhanh
   */
  async getQuickStatsForDashboard(gardenerId: number) {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Số hoạt động trong 30 ngày qua
    const recentActivitiesCount = await this.prisma.gardenActivity.count({
      where: {
        gardenerId,
        timestamp: { gte: last30Days },
      },
    });

    // Đánh giá trung bình gần đây
    const recentRating = await this.prisma.activityEvaluation.aggregate({
      where: {
        gardenerId,
        evaluatedAt: { gte: last30Days },
        rating: { not: null },
      },
      _avg: { rating: true },
    });

    // Loại hoạt động phổ biến nhất
    const mostCommonActivity = await this.prisma.gardenActivity.groupBy({
      by: ['activityType'],
      where: {
        gardenerId,
        timestamp: { gte: last30Days },
      },
      _count: { activityType: true },
      orderBy: { _count: { activityType: 'desc' } },
      take: 1,
    });

    // Thông tin cấp độ hiện tại
    const gardener = await this.prisma.gardener.findUnique({
      where: { userId: gardenerId },
      include: { experienceLevel: true },
    });

    return {
      recentActivitiesCount,
      averageRating: recentRating._avg.rating || 0,
      mostCommonActivityType: mostCommonActivity[0]?.activityType || null,
      currentLevel: gardener?.experienceLevel?.level || 1,
      experiencePoints: gardener?.experiencePoints || 0,
      motivationalMessage: this.generateDashboardMessage(
        recentActivitiesCount,
        recentRating._avg.rating || 0,
      ),
    };
  }

  private generateDashboardMessage(
    activitiesCount: number,
    avgRating: number,
  ): string {
    if (activitiesCount === 0) {
      return 'Chào mừng bạn trở lại! Hãy bắt đầu hành trình làm vườn tuyệt vời nào! 🌱';
    }

    if (activitiesCount >= 20) {
      return `Tuyệt vời! Bạn đã có ${activitiesCount} hoạt động trong tháng qua. Sự chăm chỉ của bạn thật đáng ngưỡng mộ! 🌟`;
    }

    if (avgRating >= 4) {
      return `Chất lượng hoạt động của bạn rất tốt với ${avgRating.toFixed(1)}/5 điểm! Hãy tiếp tục phát huy nhé! 👏`;
    }

    if (activitiesCount >= 5) {
      return `Bạn đang có tiến bộ tốt với ${activitiesCount} hoạt động gần đây. Hãy duy trì nhịp độ này! 💪`;
    }

    return 'Mỗi ngày là một cơ hội mới để chăm sóc khu vườn. Hãy bắt đầu hoạt động hôm nay! 🌿';
  }

  /**
   * Lấy gợi ý hoạt động cho tuần tới
   * @param gardenerId ID người làm vườn
   * @returns Danh sách gợi ý hoạt động với lịch trình
   */
  async getWeeklyActivitySuggestions(gardenerId: number) {
    // Lấy lịch sử hoạt động để phân tích
    const recentActivities = await this.prisma.gardenActivity.findMany({
      where: {
        gardenerId,
        timestamp: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 tháng qua
        },
      },
      include: {
        evaluations: true,
        garden: {
          select: {
            plantName: true,
            plantGrowStage: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Phân tích và tạo gợi ý
    const suggestions: any[] = [];
    const today = new Date();

    // Gợi ý cho 7 ngày tới
    for (let i = 1; i <= 7; i++) {
      const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const suggestion = this.generateDailySuggestion(
        targetDate,
        recentActivities,
        gardenerId,
      );

      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return {
      weeklyPlan: suggestions,
      generalTips: this.generateWeeklyTips(recentActivities),
      motivationalNote:
        'Kế hoạch tuần này được tạo dựa trên lịch sử hoạt động và nhu cầu cây trồng của bạn. Hãy linh hoạt điều chỉnh theo thời tiết thực tế nhé! 😊',
    };
  }

  private generateDailySuggestion(
    targetDate: Date,
    recentActivities: any[],
    gardenerId: number,
  ) {
    const dayOfWeek = targetDate.getDay();
    const hour = targetDate.getHours();

    // Tránh gợi ý vào những ngày/giờ không phù hợp
    if (dayOfWeek === 0 && hour < 8) return null; // Chủ nhật sáng sớm

    // Phân tích hoạt động gần đây nhất
    const lastActivity = recentActivities[0];
    const daysSinceLastActivity = lastActivity
      ? Math.floor(
          (targetDate.getTime() - new Date(lastActivity.timestamp).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 7;

    // Xác định loại hoạt động phù hợp
    let suggestedActivity: ActivityType = ActivityType.WATERING; // Mặc định
    let priority = 'MEDIUM';
    let reason = 'Hoạt động chăm sóc định kỳ';

    if (daysSinceLastActivity >= 3) {
      // Đã lâu không hoạt động
      if (lastActivity?.activityType === ActivityType.WATERING) {
        suggestedActivity = ActivityType.FERTILIZING;
        reason = 'Sau khi tưới nước, cây cần bổ sung dinh dưỡng';
      } else {
        suggestedActivity = ActivityType.WATERING;
        reason = 'Cây cần được tưới nước định kỳ';
      }
      priority = 'HIGH';
    } else if (dayOfWeek === 6) {
      // Cuối tuần - hoạt động kiểm tra tổng thể
      suggestedActivity = ActivityType.PEST_CONTROL;
      reason = 'Cuối tuần là thời điểm tốt để kiểm tra sâu bệnh';
      priority = 'MEDIUM';
    }

    return {
      date: targetDate,
      dayName: this.getDayName(dayOfWeek),
      suggestedActivity,
      activityName: this.getActivityName(suggestedActivity),
      recommendedTime: this.getRecommendedTime(suggestedActivity),
      priority,
      reason,
      estimatedDuration: this.getEstimatedDuration(suggestedActivity),
      weatherConsiderations: this.getWeatherConsiderations(suggestedActivity),
    };
  }

  private getDayName(dayOfWeek: number): string {
    const days = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy',
    ];
    return days[dayOfWeek];
  }

  private getActivityName(activityType: ActivityType): string {
    const names = {
      [ActivityType.WATERING]: 'Tưới nước',
      [ActivityType.FERTILIZING]: 'Bón phân',
      [ActivityType.PRUNING]: 'Tỉa cành',
      [ActivityType.PLANTING]: 'Trồng cây',
      [ActivityType.HARVESTING]: 'Thu hoạch',
      [ActivityType.PEST_CONTROL]: 'Kiểm tra sâu bệnh',
      [ActivityType.SOIL_TESTING]: 'Kiểm tra đất',
      [ActivityType.WEEDING]: 'Làm cỏ',
      [ActivityType.OTHER]: 'Chăm sóc chung',
    };
    return names[activityType] || 'Hoạt động làm vườn';
  }

  private getRecommendedTime(activityType: ActivityType): string {
    const timeRecommendations = {
      [ActivityType.WATERING]: '6:00 - 8:00 (sáng sớm)',
      [ActivityType.FERTILIZING]: '16:00 - 18:00 (chiều mát)',
      [ActivityType.PRUNING]: '7:00 - 10:00 (sáng có ánh sáng tốt)',
      [ActivityType.PEST_CONTROL]: '17:00 - 19:00 (chiều muộn)',
      [ActivityType.PLANTING]: '7:00 - 9:00 (sáng mát)',
      [ActivityType.HARVESTING]: '6:00 - 9:00 (sáng sớm)',
      [ActivityType.SOIL_TESTING]: 'Bất kỳ lúc nào trong ngày',
      [ActivityType.WEEDING]: '7:00 - 10:00 (sáng mát)',
    };
    return timeRecommendations[activityType] || '7:00 - 9:00 (sáng mát)';
  }

  private getEstimatedDuration(activityType: ActivityType): string {
    const durations = {
      [ActivityType.WATERING]: '15-30 phút',
      [ActivityType.FERTILIZING]: '20-40 phút',
      [ActivityType.PRUNING]: '30-60 phút',
      [ActivityType.PEST_CONTROL]: '20-30 phút',
      [ActivityType.PLANTING]: '45-90 phút',
      [ActivityType.HARVESTING]: '20-45 phút',
      [ActivityType.SOIL_TESTING]: '10-15 phút',
      [ActivityType.WEEDING]: '30-60 phút',
    };
    return durations[activityType] || '20-40 phút';
  }

  private getWeatherConsiderations(activityType: ActivityType): string[] {
    const considerations = {
      [ActivityType.WATERING]: [
        'Tránh tưới khi trời mưa',
        'Không tưới dưới nắng gắt',
      ],
      [ActivityType.FERTILIZING]: [
        'Tránh bón phân trước mưa lớn',
        'Nên bón khi đất ẩm',
      ],
      [ActivityType.PRUNING]: [
        'Tránh tỉa khi trời mưa',
        'Cần thời tiết khô để vết cắt lành',
      ],
      [ActivityType.PEST_CONTROL]: [
        'Không xịt thuốc khi có mưa',
        'Tránh gió mạnh',
      ],
    };
    return (
      considerations[activityType] || [
        'Chú ý thời tiết để đạt hiệu quả tốt nhất',
      ]
    );
  }

  private generateWeeklyTips(recentActivities: any[]): string[] {
    const tips = [
      'Hãy kiểm tra dự báo thời tiết hàng ngày để điều chỉnh kế hoạch phù hợp',
      'Ghi chép lại kết quả sau mỗi hoạt động để tích lũy kinh nghiệm',
      'Quan sát cây thường xuyên để phát hiện sớm các vấn đề',
    ];

    // Thêm tips dựa trên lịch sử
    if (recentActivities.length < 5) {
      tips.push('Hãy tăng tần suất chăm sóc để cây phát triển tốt hơn');
    }

    const avgRating = this.calculateAverageRating(recentActivities);
    if (avgRating < 3.5) {
      tips.push('Đừng nản lòng! Mỗi lần thực hành đều giúp bạn tiến bộ');
    }

    return tips.slice(0, 4);
  }

  /**
   * Lấy báo cáo thành tích cá nhân
   * @param gardenerId ID người làm vườn
   * @param timeframe Khung thời gian ('week', 'month', 'quarter', 'year')
   * @returns Báo cáo thành tích chi tiết
   */
  async getPersonalAchievementReport(
    gardenerId: number,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    const timeframes = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const days = timeframes[timeframe];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Lấy dữ liệu trong khoảng thời gian
    const activities = await this.prisma.gardenActivity.findMany({
      where: {
        gardenerId,
        timestamp: { gte: startDate },
      },
      include: {
        evaluations: true,
        garden: {
          select: { name: true, plantName: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Phân tích thành tích
    const achievements = this.analyzeAchievements(activities, timeframe);
    const milestones = this.calculateMilestones(activities);
    const improvements = this.calculateImprovements(activities);

    return {
      timeframe,
      period: `${days} ngày qua`,
      summary: {
        totalActivities: activities.length,
        averageRating: this.calculateAverageRating(activities),
        mostActiveDay: this.findMostActiveDay(activities),
        favoriteActivity: this.findFavoriteActivity(activities),
      },
      achievements,
      milestones,
      improvements,
      personalMessage: this.generateAchievementMessage(activities, timeframe),
      nextGoals: this.suggestNextGoals(activities, timeframe),
    };
  }

  private analyzeAchievements(activities: any[], timeframe: string) {
    const achievements: any[] = [];

    // Thành tích về số lượng
    if (activities.length >= 20 && timeframe === 'month') {
      achievements.push({
        type: 'quantity',
        title: 'Người làm vườn siêng năng',
        description: `Bạn đã thực hiện ${activities.length} hoạt động trong tháng qua!`,
        icon: '🏆',
        earned: true,
      });
    }

    // Thành tích về chất lượng
    const avgRating = this.calculateAverageRating(activities);
    if (avgRating >= 4.5) {
      achievements.push({
        type: 'quality',
        title: 'Bậc thầy làm vườn',
        description: `Điểm đánh giá trung bình ${avgRating.toFixed(1)}/5 - Xuất sắc!`,
        icon: '⭐',
        earned: true,
      });
    } else if (avgRating >= 4.0) {
      achievements.push({
        type: 'quality',
        title: 'Chuyên gia làm vườn',
        description: `Điểm đánh giá trung bình ${avgRating.toFixed(1)}/5 - Rất tốt!`,
        icon: '🌟',
        earned: true,
      });
    }

    // Thành tích về tính nhất quán
    const consistency = this.calculateConsistency(activities);
    if (consistency >= 4.5) {
      achievements.push({
        type: 'consistency',
        title: 'Người làm vườn nhất quán',
        description: 'Chất lượng hoạt động luôn ổn định và đáng tin cậy',
        icon: '📊',
        earned: true,
      });
    }

    return achievements;
  }

  private calculateMilestones(activities: any[]) {
    return [
      {
        milestone: 'Hoạt động đầu tiên',
        achieved: activities.length > 0,
        date:
          activities.length > 0
            ? activities[activities.length - 1].timestamp
            : null,
        description: 'Bước đầu tiên trong hành trình làm vườn',
      },
      {
        milestone: '10 hoạt động',
        achieved: activities.length >= 10,
        progress: Math.min((activities.length / 10) * 100, 100),
        description: 'Xây dựng thói quen chăm sóc cây',
      },
      {
        milestone: '50 hoạt động',
        achieved: activities.length >= 50,
        progress: Math.min((activities.length / 50) * 100, 100),
        description: 'Trở thành người làm vườn có kinh nghiệm',
      },
      {
        milestone: 'Đánh giá 5 sao',
        achieved: activities.some((a) =>
          a.evaluations.some((e) => e.rating === 5),
        ),
        description: 'Đạt được hoạt động hoàn hảo',
      },
    ];
  }

  private calculateImprovements(activities: any[]) {
    if (activities.length < 6) return null;

    const halfPoint = Math.floor(activities.length / 2);
    const recentHalf = activities.slice(0, halfPoint);
    const olderHalf = activities.slice(halfPoint);

    const recentAvg = this.calculateAverageRating(recentHalf);
    const olderAvg = this.calculateAverageRating(olderHalf);

    const improvementRate =
      olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return {
      improvementRate: Math.round(improvementRate * 10) / 10,
      trend:
        improvementRate > 5
          ? 'improving'
          : improvementRate < -5
            ? 'declining'
            : 'stable',
      message: this.getImprovementMessage(improvementRate),
    };
  }

  private getImprovementMessage(rate: number): string {
    if (rate > 20) return 'Tiến bộ vượt bậc! Bạn đang phát triển rất nhanh! 🚀';
    if (rate > 10)
      return 'Tiến bộ tốt! Bạn đang trên đường trở thành chuyên gia! 📈';
    if (rate > 5) return 'Có sự cải thiện nhẹ - hãy tiếp tục phát huy! 👍';
    if (rate > -5) return 'Hiệu suất ổn định - đây là dấu hiệu tốt! 💪';
    return 'Có chút suy giảm nhưng đây chỉ là giai đoạn tạm thời. Hãy tự tin! 💙';
  }

  private findMostActiveDay(activities: any[]): string {
    const dayCount = new Map<number, number>();

    activities.forEach((activity) => {
      const day = new Date(activity.timestamp).getDay();
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });

    let maxDay = 1; // Thứ 2 mặc định
    let maxCount = 0;

    dayCount.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        maxDay = day;
      }
    });

    return this.getDayName(maxDay);
  }

  private findFavoriteActivity(activities: any[]): string {
    const activityCount = new Map<ActivityType, number>();

    activities.forEach((activity) => {
      const type = activity.activityType;
      activityCount.set(type, (activityCount.get(type) || 0) + 1);
    });

    let favoriteType: ActivityType = ActivityType.WATERING; // Mặc định
    let maxCount = 0;

    activityCount.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteType = type;
      }
    });

    return this.getActivityName(favoriteType);
  }

  private generateAchievementMessage(
    activities: any[],
    timeframe: string,
  ): string {
    const count = activities.length;
    const avgRating = this.calculateAverageRating(activities);

    if (count === 0) {
      return `Chưa có hoạt động nào trong ${timeframe === 'week' ? 'tuần' : timeframe === 'month' ? 'tháng' : 'khoảng thời gian'} này. Hãy bắt đầu hành trình làm vườn tuyệt vời! 🌱`;
    }

    let message = `Trong ${timeframe === 'week' ? 'tuần' : timeframe === 'month' ? 'tháng' : 'khoảng thời gian'} qua, bạn đã có ${count} hoạt động `;

    if (avgRating >= 4.5) {
      message += 'với chất lượng xuất sắc! Bạn thật tuyệt vời! 🏆';
    } else if (avgRating >= 4) {
      message += 'với chất lượng rất tốt! Tiếp tục phát huy nhé! 🌟';
    } else if (avgRating >= 3.5) {
      message += 'với chất lượng khá tốt! Bạn đang tiến bộ đều đặn! 👍';
    } else {
      message += 'và đang trong quá trình học hỏi! Mỗi ngày đều có tiến bộ! 💪';
    }

    return message;
  }

  private suggestNextGoals(activities: any[], timeframe: string) {
    const goals: any[] = [];
    const count = activities.length;
    const avgRating = this.calculateAverageRating(activities);

    // Mục tiêu về số lượng
    if (timeframe === 'week' && count < 3) {
      goals.push({
        type: 'quantity',
        target: 'Thực hiện ít nhất 3 hoạt động trong tuần tới',
        current: count,
        targetValue: 3,
        motivation: 'Tần suất đều đặn giúp cây phát triển tốt hơn',
      });
    } else if (timeframe === 'month' && count < 12) {
      goals.push({
        type: 'quantity',
        target: 'Đạt 12 hoạt động trong tháng tới',
        current: count,
        targetValue: 12,
        motivation: 'Mỗi 2-3 ngày một hoạt động sẽ tạo thói quen tốt',
      });
    }

    // Mục tiêu về chất lượng
    if (avgRating < 4) {
      goals.push({
        type: 'quality',
        target: 'Đạt điểm đánh giá trung bình 4.0',
        current: avgRating.toFixed(1),
        targetValue: 4.0,
        motivation: 'Chất lượng cao giúp cây phát triển và bạn tự tin hơn',
      });
    } else if (avgRating < 4.5) {
      goals.push({
        type: 'quality',
        target: 'Duy trì điểm đánh giá trên 4.5',
        current: avgRating.toFixed(1),
        targetValue: 4.5,
        motivation: 'Mục tiêu trở thành bậc thầy làm vườn',
      });
    }

    // Mục tiêu học hỏi
    goals.push({
      type: 'learning',
      target: 'Thử một kỹ thuật mới trong hoạt động tiếp theo',
      motivation: 'Việc thử nghiệm giúp mở rộng kiến thức và kỹ năng',
    });

    return goals.slice(0, 3); // Tối đa 3 mục tiêu
  }
}
