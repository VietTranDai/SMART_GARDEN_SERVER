import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import {
  ActivityStatsQueryDto,
  ActivityStatsResponseDto,
  ActivityOverviewStatsDto,
  ActivityTypeStatsDto,
  DailyActivityStatsDto,
  MonthlyActivityStatsDto,
  GardenActivityStatsDto,
  ActivityTrendDto,
} from './dto/activity-stats.dto';
import { PrismaService } from 'src/prisma/prisma.service';

interface ActivityTypeMapping {
  name: string;
  description: string;
  icon: string;
  tips: string;
}

@Injectable()
export class ActivityStatsService {
  constructor(private prisma: PrismaService) {}

  // Mapping cho các loại hoạt động với mô tả chi tiết bằng tiếng Việt
  private readonly activityTypeMapping: Record<
    ActivityType,
    ActivityTypeMapping
  > = {
    [ActivityType.PLANTING]: {
      name: 'Trồng cây',
      description: 'Hoạt động gieo trồng và trồng cây mới trong vườn',
      icon: '🌱',
      tips: 'Nên trồng vào buổi sáng sớm hoặc chiều mát để cây dễ thích nghi',
    },
    [ActivityType.WATERING]: {
      name: 'Tưới nước',
      description: 'Cung cấp nước cho cây trồng để duy trì độ ẩm phù hợp',
      icon: '💧',
      tips: 'Tưới nước vào buổi sáng sớm hoặc chiều tối để tránh bay hơi',
    },
    [ActivityType.FERTILIZING]: {
      name: 'Bón phân',
      description:
        'Cung cấp dinh dưỡng cho cây thông qua phân bón hữu cơ hoặc vô cơ',
      icon: '🌿',
      tips: 'Bón phân sau khi tưới nước để tránh làm cháy rễ cây',
    },
    [ActivityType.PRUNING]: {
      name: 'Cắt tỉa',
      description:
        'Loại bỏ các cành lá khô, bệnh hoặc cắt tỉa tạo dáng cho cây',
      icon: '✂️',
      tips: 'Sử dụng dụng cụ sắc bén và sạch sẽ để tránh lây nhiễm bệnh',
    },
    [ActivityType.HARVESTING]: {
      name: 'Thu hoạch',
      description: 'Thu hái trái cây, rau củ hoặc hoa khi đã chín muồi',
      icon: '🌾',
      tips: 'Thu hoạch vào buổi sáng sớm khi thời tiết mát mẻ',
    },
    [ActivityType.PEST_CONTROL]: {
      name: 'Phòng trừ sâu bệnh',
      description: 'Kiểm soát và điều trị các loại sâu bệnh hại cây trồng',
      icon: '🛡️',
      tips: 'Ưu tiên sử dụng các biện pháp sinh học và thân thiện môi trường',
    },
    [ActivityType.SOIL_TESTING]: {
      name: 'Kiểm tra đất',
      description:
        'Đo lường và đánh giá chất lượng đất như pH, độ ẩm, dinh dưỡng',
      icon: '🔬',
      tips: 'Kiểm tra đất định kỳ để điều chỉnh chế độ chăm sóc phù hợp',
    },
    [ActivityType.WEEDING]: {
      name: 'Làm cỏ',
      description:
        'Loại bỏ cỏ dại và thực vật cạnh tranh dinh dưỡng với cây trồng',
      icon: '🌿',
      tips: 'Nhổ cỏ sau khi mưa hoặc tưới nước khi đất mềm',
    },
    [ActivityType.OTHER]: {
      name: 'Hoạt động khác',
      description: 'Các hoạt động chăm sóc vườn khác không thuộc danh mục trên',
      icon: '🔧',
      tips: 'Ghi chú chi tiết để theo dõi hiệu quả của hoạt động',
    },
  };

  /**
   * Lấy thống kê hoạt động chi tiết với mô tả thân thiện bằng tiếng Việt
   */
  async getActivityStats(
    gardenerId: number,
    query: ActivityStatsQueryDto,
  ): Promise<ActivityStatsResponseDto> {
    const { gardenId, startDate, endDate, activityType } = query;

    const whereCondition = {
      gardenerId,
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      ...(gardenId && { gardenId }),
      ...(activityType && { activityType }),
    };

    // Lấy tất cả hoạt động trong khoảng thời gian
    const activities = await this.prisma.gardenActivity.findMany({
      where: whereCondition,
      include: {
        garden: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Tính toán các thống kê
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const overview = await this.calculateOverviewStats(
      activities,
      startDateObj,
      endDateObj,
    );
    const byActivityType = this.calculateActivityTypeStats(activities);
    const dailyStats = this.calculateDailyStats(activities);
    const monthlyStats = this.calculateMonthlyStats(activities);
    const byGarden = !gardenId
      ? this.calculateGardenStats(activities)
      : undefined;
    const trends = this.calculateTrends(activities, startDateObj, endDateObj);

    return {
      overview,
      byActivityType,
      dailyStats,
      monthlyStats,
      byGarden,
      trends,
      generatedAt: new Date().toISOString(),
      period: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Tính toán thống kê tổng quan với mô tả thân thiện
   */
  private async calculateOverviewStats(
    activities: any[],
    startDate: Date,
    endDate: Date,
  ): Promise<ActivityOverviewStatsDto> {
    const totalActivities = activities.length;
    const totalDays = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    // Tính số ngày có hoạt động
    const activeDaysSet = new Set(
      activities.map(
        (activity) => activity.timestamp.toISOString().split('T')[0],
      ),
    );
    const activeDays = activeDaysSet.size;

    // Tính trung bình hoạt động mỗi ngày
    const averagePerDay = totalActivities / totalDays;

    // Tính tỷ lệ ngày có hoạt động
    const activityRate = (activeDays / totalDays) * 100;

    // Tìm loại hoạt động phổ biến nhất
    const activityTypeCounts = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {});

    const mostCommonActivity =
      totalActivities > 0
        ? (Object.keys(activityTypeCounts).reduce((a, b) =>
            activityTypeCounts[a] > activityTypeCounts[b] ? a : b,
          ) as ActivityType)
        : ActivityType.OTHER;

    // Tìm khu vườn có nhiều hoạt động nhất
    const gardenCounts = activities.reduce((acc, activity) => {
      const gardenName = activity.garden?.name || 'Khu vườn chưa đặt tên';
      acc[gardenName] = (acc[gardenName] || 0) + 1;
      return acc;
    }, {});

    const mostActiveGarden =
      Object.keys(gardenCounts).length > 0
        ? Object.keys(gardenCounts).reduce((a, b) =>
            gardenCounts[a] > gardenCounts[b] ? a : b,
          )
        : undefined;

    return {
      totalActivities,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      activeDays,
      totalDays,
      activityRate: Math.round(activityRate * 100) / 100,
      mostCommonActivity,
      mostCommonActivityName: this.activityTypeMapping[mostCommonActivity].name,
      mostActiveGarden,
    };
  }

  /**
   * Tính toán thống kê theo loại hoạt động với mô tả chi tiết
   */
  private calculateActivityTypeStats(
    activities: any[],
  ): ActivityTypeStatsDto[] {
    const totalActivities = activities.length;
    const activityTypeCounts = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(activityTypeCounts)
      .map(([type, count]) => {
        const mapping = this.activityTypeMapping[type as ActivityType];
        return {
          type: type as ActivityType,
          displayName: `${mapping.icon} ${mapping.name}`,
          count: count as number,
          percentage:
            totalActivities > 0
              ? Math.round(((count as number) / totalActivities) * 10000) / 100
              : 0,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Tính toán thống kê theo ngày với format tiếng Việt
   */
  private calculateDailyStats(activities: any[]): DailyActivityStatsDto[] {
    const dailyGroups = activities.reduce((acc, activity) => {
      const date = activity.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    return Object.entries(dailyGroups)
      .map(([date, dayActivities]) => ({
        date: this.formatVietnameseDate(new Date(date)),
        activityCount: (dayActivities as any[]).length,
        activityBreakdown: this.calculateActivityTypeStats(
          dayActivities as any[],
        ),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Tính toán thống kê theo tháng với mô tả chi tiết
   */
  private calculateMonthlyStats(activities: any[]): MonthlyActivityStatsDto[] {
    const monthlyGroups = activities.reduce((acc, activity) => {
      const month = activity.timestamp.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          activities: [],
          days: new Set(),
        };
      }
      acc[month].activities.push(activity);
      acc[month].days.add(activity.timestamp.toISOString().split('T')[0]);
      return acc;
    }, {});

    return Object.entries(monthlyGroups)
      .map(([month, data]) => {
        const activeDays = (data as any).days.size;
        const activityCount = (data as any).activities.length;

        return {
          month: this.formatVietnameseMonth(month),
          activityCount,
          activeDays,
          averagePerDay:
            activeDays > 0
              ? Math.round((activityCount / activeDays) * 100) / 100
              : 0,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Tính toán thống kê theo khu vườn với mô tả thân thiện
   */
  private calculateGardenStats(activities: any[]): GardenActivityStatsDto[] {
    const gardenGroups = activities.reduce((acc, activity) => {
      const gardenId = activity.gardenId;
      if (!acc[gardenId]) {
        acc[gardenId] = {
          garden: activity.garden,
          activities: [],
        };
      }
      acc[gardenId].activities.push(activity);
      return acc;
    }, {});

    return Object.values(gardenGroups)
      .map((data: any) => {
        const sortedActivities = data.activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        const gardenTypeNames = {
          INDOOR: 'Vườn trong nhà',
          OUTDOOR: 'Vườn ngoài trời',
          BALCONY: 'Vườn ban công',
          ROOFTOP: 'Vườn sân thượng',
          WINDOW_SILL: 'Vườn cửa sổ',
        };

        return {
          gardenId: data.garden.id,
          gardenName: data.garden.name || 'Khu vườn chưa đặt tên',
          gardenType: gardenTypeNames[data.garden.type] || data.garden.type,
          totalActivities: data.activities.length,
          lastActivity: sortedActivities[0]?.timestamp.toISOString(),
          activityBreakdown: this.calculateActivityTypeStats(data.activities),
        };
      })
      .sort((a, b) => b.totalActivities - a.totalActivities);
  }

  /**
   * Tính toán xu hướng hoạt động với phân tích thông minh
   */
  private calculateTrends(
    activities: any[],
    startDate: Date,
    endDate: Date,
  ): ActivityTrendDto[] {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 14) {
      return this.calculateDailyTrends(activities);
    } else if (diffDays <= 90) {
      return this.calculateWeeklyTrends(activities);
    } else {
      return this.calculateMonthlyTrends(activities);
    }
  }

  /**
   * Xu hướng theo ngày với mô tả thay đổi
   */
  private calculateDailyTrends(activities: any[]): ActivityTrendDto[] {
    const dailyGroups = activities.reduce((acc, activity) => {
      const date = activity.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dates = Object.keys(dailyGroups).sort();
    return dates.map((date, index) => {
      const currentCount = dailyGroups[date];
      const previousCount =
        index > 0 ? dailyGroups[dates[index - 1]] : currentCount;
      const changePercent =
        previousCount > 0
          ? Math.round(
              ((currentCount - previousCount) / previousCount) * 10000,
            ) / 100
          : 0;

      return {
        period: 'day',
        label: this.formatVietnameseDate(new Date(date)),
        count: currentCount,
        changePercent,
      };
    });
  }

  /**
   * Xu hướng theo tuần với phân tích chi tiết
   */
  private calculateWeeklyTrends(activities: any[]): ActivityTrendDto[] {
    const weeklyGroups = activities.reduce((acc, activity) => {
      const date = new Date(activity.timestamp);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      acc[weekKey] = (acc[weekKey] || 0) + 1;
      return acc;
    }, {});

    const weeks = Object.keys(weeklyGroups).sort();
    return weeks.map((weekStart, index) => {
      const currentCount = weeklyGroups[weekStart];
      const previousCount =
        index > 0 ? weeklyGroups[weeks[index - 1]] : currentCount;
      const changePercent =
        previousCount > 0
          ? Math.round(
              ((currentCount - previousCount) / previousCount) * 10000,
            ) / 100
          : 0;

      const weekNum = this.getWeekNumber(new Date(weekStart));
      const year = new Date(weekStart).getFullYear();

      return {
        period: 'week',
        label: `Tuần ${weekNum}/${year}`,
        count: currentCount,
        changePercent,
      };
    });
  }

  /**
   * Xu hướng theo tháng với insight thông minh
   */
  private calculateMonthlyTrends(activities: any[]): ActivityTrendDto[] {
    const monthlyGroups = activities.reduce((acc, activity) => {
      const month = activity.timestamp.toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const months = Object.keys(monthlyGroups).sort();
    return months.map((month, index) => {
      const currentCount = monthlyGroups[month];
      const previousCount =
        index > 0 ? monthlyGroups[months[index - 1]] : currentCount;
      const changePercent =
        previousCount > 0
          ? Math.round(
              ((currentCount - previousCount) / previousCount) * 10000,
            ) / 100
          : 0;

      return {
        period: 'month',
        label: this.formatVietnameseMonth(month),
        count: currentCount,
        changePercent,
      };
    });
  }

  /**
   * Format ngày tháng theo kiểu Việt Nam
   */
  private formatVietnameseDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    };
    return date.toLocaleDateString('vi-VN', options);
  }

  /**
   * Format tháng theo kiểu Việt Nam
   */
  private formatVietnameseMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      timeZone: 'Asia/Ho_Chi_Minh',
    };
    return date.toLocaleDateString('vi-VN', options);
  }

  /**
   * Lấy ngày đầu tuần (Thứ 2)
   */
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 là ngày đầu tuần
    return new Date(date.setDate(diff));
  }

  /**
   * Lấy số tuần trong năm
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Lấy thống kê tóm tắt nhanh cho dashboard
   */
  async getQuickStats(gardenerId: number, gardenId?: number): Promise<any> {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const whereCondition = {
      gardenerId,
      ...(gardenId && { gardenId }),
    };

    const [todayActivities, weekActivities, monthActivities, lastActivity] =
      await Promise.all([
        this.prisma.gardenActivity.count({
          where: {
            ...whereCondition,
            timestamp: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
              lte: new Date(today.setHours(23, 59, 59, 999)),
            },
          },
        }),
        this.prisma.gardenActivity.count({
          where: {
            ...whereCondition,
            timestamp: {
              gte: sevenDaysAgo,
            },
          },
        }),
        this.prisma.gardenActivity.count({
          where: {
            ...whereCondition,
            timestamp: {
              gte: thirtyDaysAgo,
            },
          },
        }),
        this.prisma.gardenActivity.findFirst({
          where: whereCondition,
          include: {
            garden: {
              select: { name: true },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        }),
      ]);

    return {
      todayActivities,
      weekActivities,
      monthActivities,
      lastActivity: lastActivity
        ? {
            name: lastActivity.name,
            type: this.activityTypeMapping[lastActivity.activityType].name,
            garden: lastActivity.garden.name,
            timestamp: lastActivity.timestamp.toISOString(),
            relativeTime: this.getRelativeTime(lastActivity.timestamp),
          }
        : null,
      summary: this.generateQuickSummary(
        todayActivities,
        weekActivities,
        monthActivities,
      ),
    };
  }

  /**
   * Tạo tóm tắt nhanh thân thiện
   */
  private generateQuickSummary(
    today: number,
    week: number,
    month: number,
  ): string {
    if (today > 0) {
      return `🎉 Tuyệt vời! Hôm nay bạn đã thực hiện ${today} hoạt động chăm sóc vườn.`;
    } else if (week > 0) {
      const avgPerDay = Math.round((week / 7) * 10) / 10;
      return `🌱 Tuần này bạn đã có ${week} hoạt động, trung bình ${avgPerDay} hoạt động/ngày.`;
    } else if (month > 0) {
      return `📊 Tháng này bạn đã thực hiện ${month} hoạt động chăm sóc vườn.`;
    } else {
      return `💡 Hãy bắt đầu ghi lại các hoạt động chăm sóc vườn để theo dõi tiến trình nhé!`;
    }
  }

  /**
   * Tính thời gian tương đối bằng tiếng Việt
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'vừa xong' : `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 giờ trước' : `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'hôm qua' : `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  }
}
