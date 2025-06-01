import { ActivityType, TaskStatus, WeatherMain } from "@prisma/client";
import { WateringScheduleDto } from "../../watering_schedule/dto/watering-schedule.dto";

export interface GardenActivityCalendarDto {
    gardenId: number;
    gardenName: string;
    gardenProfilePicture?: string;
    plantName?: string;
    plantGrowStage?: string;

    summary: {
        totalActivitiesThisWeek: number;
        upcomingTasksCount: number;
        completedTasksToday: number;
        pendingTasksToday: number;
    };

    recentActivities: RecentActivityDto[];

    upcomingTasks: UpcomingTaskDto[];

    upcomingWateringSchedules: WateringScheduleDto[];
}
  
export interface RecentActivityDto {
    id: number;
    name: string;
    activityType: ActivityType;
    timestamp: Date;
    plantName?: string;
    plantGrowStage?: string;
    details?: string;
    notes?: string;

    environmentalConditions?: {
        temperature?: number;
        humidity?: number;
        soilMoisture?: number;
        weather?: {
        main: WeatherMain;
        description: string;
        iconCode: string;
        };
    };

    evaluation?: {
        rating?: number;
        outcome?: string;
        comments?: string;
    };

    photos?: {
        url: string;
        aiFeedback?: string;
        confidence?: number;
    }[];
}

export interface UpcomingTaskDto {
    id: number;
    type: string;
    description: string;
    dueDate: Date;
    status: TaskStatus;
    plantTypeName?: string;
    plantStageName?: string;

    priority: 'HIGH' | 'MEDIUM' | 'LOW';

    timeRemaining: {
        days: number;
        hours: number;
        isOverdue: boolean;
    };

    recommendations?: {
        optimalTime?: string;
        weatherConsiderations?: string;
        tips?: string;
    };
}