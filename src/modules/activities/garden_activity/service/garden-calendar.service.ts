import { Injectable } from '@nestjs/common';
import { ActivityType, TaskStatus, WeatherMain } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GardenActivityCalendarDto, RecentActivityDto, UpcomingTaskDto } from '../dto/garden-activity-calendar.dto';
import { WateringScheduleDto } from '../../watering_schedule/dto/watering-schedule.dto';

@Injectable()
export class GardenerCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getGardenActivityCalendar(
    gardenerId: number,
    gardenId?: number
  ): Promise<GardenActivityCalendarDto[]> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Query tất cả gardens của gardener hoặc garden cụ thể
    const gardens = await this.prisma.garden.findMany({
      where: {
        gardenerId,
        ...(gardenId && { id: gardenId }),
        status: 'ACTIVE'
      },
      include: {
        // Activities trong 7 ngày qua
        activities: {
          where: {
            timestamp: {
              gte: sevenDaysAgo,
              lte: now
            }
          },
          include: {
            weatherObservation: true,
            photoEvaluations: true,
            evaluations: {
              include: {
                gardener: {
                  include: {
                    user: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10 // Giới hạn số lượng activities gần đây
        },
        
        // Tasks sắp tới (7 ngày tới) và tasks hôm nay
        tasks: {
          where: {
            OR: [
              {
                // Tasks sắp tới
                dueDate: {
                  gte: now,
                  lte: sevenDaysFromNow
                },
                status: 'PENDING'
              },
              {
                // Tasks đã hoàn thành hôm nay
                completedAt: {
                  gte: startOfToday,
                  lt: endOfToday
                },
                status: 'COMPLETED'
              },
              {
                // Tasks pending hôm nay
                dueDate: {
                  gte: startOfToday,
                  lt: endOfToday
                },
                status: 'PENDING'
              }
            ]
          },
          orderBy: {
            dueDate: 'asc'
          }
        },
        
        // Watering schedules sắp tới
        wateringSchedule: {
          where: {
            scheduledAt: {
              gte: now,
              lte: sevenDaysFromNow
            },
            status: 'PENDING'
          },
          orderBy: {
            scheduledAt: 'asc'
          }
        },
        
        // Hourly forecast để đưa ra recommendations
        hourlyForecast: {
          where: {
            forecastFor: {
              gte: now,
              lte: sevenDaysFromNow
            }
          },
          orderBy: {
            forecastFor: 'asc'
          }
        }
      }
    });

    return gardens.map(garden => this.mapToGardenActivityCalendarDto(garden));
  }

  private mapToGardenActivityCalendarDto(garden: any): GardenActivityCalendarDto {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Tính toán summary
    const activitiesThisWeek = garden.activities.filter(activity => 
      new Date(activity.timestamp) >= sevenDaysAgo
    );

    const tasksToday = garden.tasks.filter(task =>
      new Date(task.dueDate) >= startOfToday && new Date(task.dueDate) < endOfToday
    );

    const completedTasksToday = garden.tasks.filter(task =>
      task.status === 'COMPLETED' && 
      task.completedAt &&
      new Date(task.completedAt) >= startOfToday && 
      new Date(task.completedAt) < endOfToday
    );

    const pendingTasksToday = tasksToday.filter(task => task.status === 'PENDING');

    const upcomingTasks = garden.tasks.filter(task =>
      task.status === 'PENDING' && new Date(task.dueDate) >= now
    );

    return {
      gardenId: garden.id,
      gardenName: garden.name,
      gardenProfilePicture: garden.profilePicture,
      plantName: garden.plantName,
      plantGrowStage: garden.plantGrowStage,

      summary: {
        totalActivitiesThisWeek: activitiesThisWeek.length,
        upcomingTasksCount: upcomingTasks.length,
        completedTasksToday: completedTasksToday.length,
        pendingTasksToday: pendingTasksToday.length
      },

      recentActivities: this.mapToRecentActivitiesDto(garden.activities),
      upcomingTasks: this.mapToUpcomingTasksDto(upcomingTasks, garden.hourlyForecast),
      upcomingWateringSchedules: this.mapToWateringSchedulesDto(garden.wateringSchedule, garden.hourlyForecast)
    };
  }

  private mapToRecentActivitiesDto(activities: any[]): RecentActivityDto[] {
    return activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      activityType: activity.activityType as ActivityType,
      timestamp: activity.timestamp,
      plantName: activity.plantName,
      plantGrowStage: activity.plantGrowStage,
      details: activity.details,
      notes: activity.notes,

      environmentalConditions: {
        temperature: activity.temperature,
        humidity: activity.humidity,
        soilMoisture: activity.soilMoisture,
        weather: activity.weatherObservation ? {
          main: activity.weatherObservation.weatherMain as WeatherMain,
          description: activity.weatherObservation.weatherDesc,
          iconCode: activity.weatherObservation.iconCode
        } : undefined
      },

      evaluation: activity.evaluations && activity.evaluations.length > 0 ? {
        rating: activity.evaluations[0].rating,
        outcome: activity.evaluations[0].outcome,
        comments: activity.evaluations[0].comments
      } : undefined,

      photos: activity.photoEvaluations?.map(photo => ({
        url: photo.photoUrl,
        aiFeedback: photo.aiFeedback,
        confidence: photo.confidence
      })) || []
    }));
  }

  private mapToUpcomingTasksDto(tasks: any[], forecasts: any[]): UpcomingTaskDto[] {
    const now = new Date();

    return tasks.map(task => {
      const dueDate = new Date(task.dueDate);
      const timeToGo = dueDate.getTime() - now.getTime();
      const days = Math.floor(timeToGo / (24 * 60 * 60 * 1000));
      const hours = Math.floor((timeToGo % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      
      // Tìm forecast gần nhất với due date
      const nearestForecast = this.findNearestForecast(dueDate, forecasts);
      
      // Xác định priority
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (timeToGo < 0) priority = 'HIGH'; // Overdue
      else if (days <= 0) priority = 'HIGH'; // Due today
      else if (days <= 2) priority = 'MEDIUM'; // Due within 2 days
      
      // Tạo recommendations
      const recommendations = this.generateTaskRecommendations(task, nearestForecast);

      return {
        id: task.id,
        type: task.type,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status as TaskStatus,
        plantTypeName: task.plantTypeName,
        plantStageName: task.plantStageName,
        priority,
        timeRemaining: {
          days: Math.max(0, days),
          hours: Math.max(0, hours),
          isOverdue: timeToGo < 0
        },
        recommendations
      };
    });
  }

  private mapToWateringSchedulesDto(schedules: any[], forecasts: any[]): WateringScheduleDto[] {
    return schedules.map(schedule => {
      const scheduledTime = new Date(schedule.scheduledAt);
      const nearestForecast = this.findNearestForecast(scheduledTime, forecasts);

      return {
        id: schedule.id,
        gardenId: schedule.gardenId,
        scheduledAt: schedule.scheduledAt,
        amount: schedule.amount,
        reason: schedule.reason,
        status: schedule.status,
        notes: schedule.notes,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        
        // Thêm thông tin weather forecast nếu có
        weatherForecast: nearestForecast ? {
          temperature: nearestForecast.temp,
          humidity: nearestForecast.humidity,
          precipitation: nearestForecast.pop,
          description: nearestForecast.weatherDesc,
          iconCode: nearestForecast.iconCode
        } : undefined,

        // Gợi ý điều chỉnh dựa trên thời tiết
        adjustmentSuggestion: this.generateWateringAdjustment(schedule, nearestForecast)
      };
    });
  }

  private findNearestForecast(targetTime: Date, forecasts: any[]): any | null {
    if (!forecasts || forecasts.length === 0) return null;

    return forecasts.reduce((nearest, current) => {
      const currentDiff = Math.abs(new Date(current.forecastFor).getTime() - targetTime.getTime());
      const nearestDiff = Math.abs(new Date(nearest.forecastFor).getTime() - targetTime.getTime());
      return currentDiff < nearestDiff ? current : nearest;
    });
  }

  private generateTaskRecommendations(task: any, forecast: any): {
    optimalTime?: string;
    weatherConsiderations?: string;
    tips?: string;
  } | undefined {
    if (!forecast) return undefined;

    const recommendations: any = {};

    // Gợi ý thời gian tối ưu dựa trên loại task
    switch (task.type.toLowerCase()) {
      case 'watering':
        if (forecast.pop > 0.7) {
          recommendations.weatherConsiderations = 'Có thể sẽ mưa, hãy kiểm tra lại trước khi tưới';
        }
        recommendations.optimalTime = 'Sáng sớm (6-8h) hoặc chiều tối (17-19h)';
        break;
      
      case 'fertilizing':
        if (forecast.pop > 0.5) {
          recommendations.weatherConsiderations = 'Tránh bón phân khi trời mưa';
        }
        recommendations.optimalTime = 'Buổi sáng khi thời tiết khô ráo';
        break;
      
      case 'pruning':
        if (forecast.weatherMain === 'RAIN') {
          recommendations.weatherConsiderations = 'Không nên cắt tỉa khi trời mưa';
        }
        recommendations.optimalTime = 'Buổi sáng khi cây không bị stress';
        break;
    }

    // Gợi ý dựa trên nhiệt độ
    if (forecast.temp > 35) {
      recommendations.tips = 'Nhiệt độ cao, tránh làm việc vào giữa trưa';
    } else if (forecast.temp < 10) {
      recommendations.tips = 'Nhiệt độ thấp, hãy bảo vệ cây khỏi lạnh';
    }

    return Object.keys(recommendations).length > 0 ? recommendations : undefined;
  }

  private generateWateringAdjustment(schedule: any, forecast: any): {
    recommendedAmount?: number;
    reason?: string;
  } | undefined {
    if (!forecast || !schedule.amount) return undefined;

    let adjustmentFactor = 1;
    let reasons: string[] = [];

    // Điều chỉnh dựa trên xác suất mưa
    if (forecast.pop > 0.7) {
      adjustmentFactor *= 0.3; // Giảm 70%
      reasons.push('có khả năng mưa cao');
    } else if (forecast.pop > 0.4) {
      adjustmentFactor *= 0.7; // Giảm 30%
      reasons.push('có thể có mưa');
    }

    // Điều chỉnh dựa trên nhiệt độ
    if (forecast.temp > 35) {
      adjustmentFactor *= 1.2; // Tăng 20%
      reasons.push('nhiệt độ cao');
    } else if (forecast.temp < 15) {
      adjustmentFactor *= 0.8; // Giảm 20%
      reasons.push('nhiệt độ thấp');
    }

    // Điều chỉnh dựa trên độ ẩm
    if (forecast.humidity > 80) {
      adjustmentFactor *= 0.9; // Giảm 10%
      reasons.push('độ ẩm cao');
    } else if (forecast.humidity < 40) {
      adjustmentFactor *= 1.1; // Tăng 10%
      reasons.push('độ ẩm thấp');
    }

    const recommendedAmount = Math.round(schedule.amount * adjustmentFactor * 10) / 10;

    // Chỉ trả về gợi ý nếu có sự thay đổi đáng kể (>10%)
    if (Math.abs(adjustmentFactor - 1) > 0.1) {
      return {
        recommendedAmount,
        reason: `Điều chỉnh do ${reasons.join(', ')}`
      };
    }

    return undefined;
  }

  // Utility method để lấy calendar cho một garden cụ thể
  async getGardenCalendarById(gardenerId: number, gardenId: number): Promise<GardenActivityCalendarDto | null> {
    const calendars = await this.getGardenActivityCalendar(gardenerId, gardenId);
    return calendars.length > 0 ? calendars[0] : null;
  }
}