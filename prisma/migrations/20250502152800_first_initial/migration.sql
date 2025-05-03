-- CreateEnum
CREATE TYPE "GardenStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GardenType" AS ENUM ('INDOOR', 'OUTDOOR', 'BALCONY', 'ROOFTOP', 'WINDOW_SILL');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('HUMIDITY', 'TEMPERATURE', 'LIGHT', 'WATER_LEVEL', 'RAINFALL', 'SOIL_MOISTURE', 'SOIL_PH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('PLANTING', 'WATERING', 'FERTILIZING', 'PRUNING', 'HARVESTING', 'PEST_CONTROL', 'SOIL_TESTING', 'WEEDING', 'OTHER');

-- CreateEnum
CREATE TYPE "EvaluatorType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WeatherMain" AS ENUM ('THUNDERSTORM', 'DRIZZLE', 'RAIN', 'SNOW', 'ATMOSPHERE', 'CLEAR', 'CLOUDS');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('WEATHER', 'SENSOR_ERROR', 'SYSTEM', 'PLANT_CONDITION', 'ACTIVITY', 'MAINTENANCE', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'IGNORED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "NotificationMethod" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'NONE');

-- CreateEnum
CREATE TYPE "VoteTargetType" AS ENUM ('POST', 'COMMENT');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "roleId" INTEGER NOT NULL,
    "refreshToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "profilePicture" TEXT,
    "address" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ExperienceLevel" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "minXP" INTEGER NOT NULL,
    "maxXP" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gardener" (
    "userId" INTEGER NOT NULL,
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "experienceLevelId" INTEGER NOT NULL,

    CONSTRAINT "Gardener_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Garden" (
    "id" SERIAL NOT NULL,
    "gardenKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePicture" TEXT,
    "description" TEXT,
    "street" TEXT,
    "ward" TEXT,
    "district" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "gardenerId" INTEGER NOT NULL,
    "type" "GardenType" NOT NULL DEFAULT 'OUTDOOR',
    "status" "GardenStatus" NOT NULL DEFAULT 'ACTIVE',
    "plantName" TEXT,
    "plantGrowStage" TEXT,
    "plantStartDate" TIMESTAMP(3),
    "plantDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "sensorKey" TEXT NOT NULL,
    "type" "SensorType" NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorData" (
    "id" SERIAL NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "gardenId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SensorData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "gardenerId" INTEGER NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "plantTypeName" TEXT,
    "plantStageName" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wateringScheduleId" INTEGER,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenActivity" (
    "id" SERIAL NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "gardenerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "plantName" TEXT,
    "plantGrowStage" TEXT,
    "weatherObservationId" INTEGER,
    "humidity" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "lightIntensity" DOUBLE PRECISION,
    "waterLevel" DOUBLE PRECISION,
    "rainfall" DOUBLE PRECISION,
    "soilMoisture" DOUBLE PRECISION,
    "soilPH" DOUBLE PRECISION,
    "details" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GardenActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvaluation" (
    "id" SERIAL NOT NULL,
    "gardenActivityId" INTEGER NOT NULL,
    "evaluatorType" "EvaluatorType" NOT NULL,
    "gardenerId" INTEGER,
    "humidity" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "lightIntensity" DOUBLE PRECISION,
    "waterLevel" DOUBLE PRECISION,
    "rainfall" DOUBLE PRECISION,
    "soilMoisture" DOUBLE PRECISION,
    "soilPH" DOUBLE PRECISION,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "outcome" TEXT,
    "rating" INTEGER,
    "metrics" JSONB,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "ActivityEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WateringSchedule" (
    "id" SERIAL NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WateringSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoEvaluation" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "gardenerId" INTEGER NOT NULL,
    "plantName" TEXT,
    "plantGrowStage" TEXT,
    "photoUrl" TEXT NOT NULL,
    "aiFeedback" TEXT,
    "confidence" DOUBLE PRECISION,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantType" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" SERIAL NOT NULL,
    "plantTypeId" INTEGER,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "family" TEXT,
    "description" TEXT,
    "growthDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthStage" (
    "id" SERIAL NOT NULL,
    "plantId" INTEGER NOT NULL,
    "stageName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT,
    "optimalTemperatureMin" DOUBLE PRECISION NOT NULL,
    "optimalTemperatureMax" DOUBLE PRECISION NOT NULL,
    "optimalHumidityMin" DOUBLE PRECISION NOT NULL,
    "optimalHumidityMax" DOUBLE PRECISION NOT NULL,
    "optimalPHMin" DOUBLE PRECISION,
    "optimalPHMax" DOUBLE PRECISION,
    "optimalLightMin" DOUBLE PRECISION,
    "optimalLightMax" DOUBLE PRECISION,
    "lightRequirement" TEXT,
    "waterRequirement" TEXT,
    "nutrientRequirement" TEXT,
    "careInstructions" TEXT,
    "pestSusceptibility" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherObservation" (
    "id" SERIAL NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION NOT NULL,
    "dewPoint" DOUBLE PRECISION NOT NULL,
    "pressure" INTEGER NOT NULL,
    "humidity" INTEGER NOT NULL,
    "clouds" INTEGER NOT NULL,
    "visibility" INTEGER NOT NULL,
    "uvi" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDeg" INTEGER NOT NULL,
    "windGust" DOUBLE PRECISION,
    "rain1h" DOUBLE PRECISION,
    "snow1h" DOUBLE PRECISION,
    "weatherMain" "WeatherMain" NOT NULL,
    "weatherDesc" TEXT NOT NULL,
    "iconCode" TEXT NOT NULL,

    CONSTRAINT "WeatherObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyForecast" (
    "id" SERIAL NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "forecastFor" TIMESTAMP(3) NOT NULL,
    "forecastedAt" TIMESTAMP(3) NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION NOT NULL,
    "dewPoint" DOUBLE PRECISION NOT NULL,
    "pressure" INTEGER NOT NULL,
    "humidity" INTEGER NOT NULL,
    "clouds" INTEGER NOT NULL,
    "visibility" INTEGER NOT NULL,
    "uvi" DOUBLE PRECISION NOT NULL,
    "pop" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDeg" INTEGER NOT NULL,
    "windGust" DOUBLE PRECISION,
    "rain1h" DOUBLE PRECISION,
    "snow1h" DOUBLE PRECISION,
    "weatherMain" "WeatherMain" NOT NULL,
    "weatherDesc" TEXT NOT NULL,
    "iconCode" TEXT NOT NULL,

    CONSTRAINT "HourlyForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyForecast" (
    "id" SERIAL NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "forecastFor" TIMESTAMP(3) NOT NULL,
    "forecastedAt" TIMESTAMP(3) NOT NULL,
    "tempDay" DOUBLE PRECISION NOT NULL,
    "tempMin" DOUBLE PRECISION NOT NULL,
    "tempMax" DOUBLE PRECISION NOT NULL,
    "tempNight" DOUBLE PRECISION NOT NULL,
    "feelsLikeDay" DOUBLE PRECISION NOT NULL,
    "dewPoint" DOUBLE PRECISION NOT NULL,
    "pressure" INTEGER NOT NULL,
    "humidity" INTEGER NOT NULL,
    "clouds" INTEGER NOT NULL,
    "uvi" DOUBLE PRECISION NOT NULL,
    "pop" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDeg" INTEGER NOT NULL,
    "windGust" DOUBLE PRECISION,
    "rain" DOUBLE PRECISION,
    "snow" DOUBLE PRECISION,
    "weatherMain" "WeatherMain" NOT NULL,
    "weatherDesc" TEXT NOT NULL,
    "iconCode" TEXT NOT NULL,

    CONSTRAINT "DailyForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeRegions" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "code_name_en" TEXT NOT NULL,

    CONSTRAINT "AdministrativeRegions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrativeUnits" (
    "id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "full_name_en" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "short_name_en" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "code_name_en" TEXT NOT NULL,

    CONSTRAINT "AdministrativeUnits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provinces" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "full_name_en" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "administrative_unit_id" INTEGER NOT NULL,
    "administrative_region_id" INTEGER NOT NULL,

    CONSTRAINT "Provinces_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Districts" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "full_name_en" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "province_code" TEXT NOT NULL,
    "administrative_unit_id" INTEGER NOT NULL,

    CONSTRAINT "Districts_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Wards" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "full_name_en" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "district_code" TEXT NOT NULL,
    "administrative_unit_id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isNoResult" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Wards_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" "AlertStatus" NOT NULL,
    "notificationMethod" "NotificationMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "gardenerId" INTEGER NOT NULL,
    "gardenId" INTEGER,
    "plantName" TEXT,
    "plantGrowStage" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "total_vote" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "gardenerId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "gardenerId" INTEGER NOT NULL,
    "targetType" "VoteTargetType" NOT NULL,
    "targetId" INTEGER NOT NULL,
    "voteValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostImage" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" INTEGER NOT NULL,
    "followedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followedId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_lastLogin_idx" ON "User"("lastLogin");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceLevel_level_key" ON "ExperienceLevel"("level");

-- CreateIndex
CREATE INDEX "Gardener_experiencePoints_idx" ON "Gardener"("experiencePoints");

-- CreateIndex
CREATE INDEX "Gardener_experienceLevelId_idx" ON "Gardener"("experienceLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "Garden_gardenKey_key" ON "Garden"("gardenKey");

-- CreateIndex
CREATE INDEX "Garden_plantName_idx" ON "Garden"("plantName");

-- CreateIndex
CREATE INDEX "Garden_plantGrowStage_idx" ON "Garden"("plantGrowStage");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_sensorKey_key" ON "Sensor"("sensorKey");

-- CreateIndex
CREATE INDEX "SensorData_sensorId_timestamp_idx" ON "SensorData"("sensorId", "timestamp");

-- CreateIndex
CREATE INDEX "Task_gardenerId_dueDate_idx" ON "Task"("gardenerId", "dueDate");

-- CreateIndex
CREATE INDEX "WateringSchedule_gardenId_scheduledAt_idx" ON "WateringSchedule"("gardenId", "scheduledAt");

-- CreateIndex
CREATE INDEX "PhotoEvaluation_plantName_evaluatedAt_idx" ON "PhotoEvaluation"("plantName", "evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlantType_name_key" ON "PlantType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_name_key" ON "Plant"("name");

-- CreateIndex
CREATE INDEX "WeatherObservation_gardenId_observedAt_idx" ON "WeatherObservation"("gardenId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherObservation_gardenId_observedAt_key" ON "WeatherObservation"("gardenId", "observedAt");

-- CreateIndex
CREATE INDEX "HourlyForecast_gardenId_forecastFor_idx" ON "HourlyForecast"("gardenId", "forecastFor");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyForecast_gardenId_forecastFor_key" ON "HourlyForecast"("gardenId", "forecastFor");

-- CreateIndex
CREATE INDEX "DailyForecast_gardenId_forecastFor_idx" ON "DailyForecast"("gardenId", "forecastFor");

-- CreateIndex
CREATE UNIQUE INDEX "DailyForecast_gardenId_forecastFor_key" ON "DailyForecast"("gardenId", "forecastFor");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_total_vote_idx" ON "Post"("total_vote");

-- CreateIndex
CREATE INDEX "Post_gardenerId_idx" ON "Post"("gardenerId");

-- CreateIndex
CREATE INDEX "Post_title_idx" ON "Post"("title");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_score_idx" ON "Comment"("score");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Vote_targetType_targetId_idx" ON "Vote"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_gardenerId_targetType_targetId_key" ON "Vote"("gardenerId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followedId_idx" ON "Follow"("followedId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gardener" ADD CONSTRAINT "Gardener_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gardener" ADD CONSTRAINT "Gardener_experienceLevelId_fkey" FOREIGN KEY ("experienceLevelId") REFERENCES "ExperienceLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Garden" ADD CONSTRAINT "Garden_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorData" ADD CONSTRAINT "SensorData_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorData" ADD CONSTRAINT "SensorData_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_wateringScheduleId_fkey" FOREIGN KEY ("wateringScheduleId") REFERENCES "WateringSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenActivity" ADD CONSTRAINT "GardenActivity_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenActivity" ADD CONSTRAINT "GardenActivity_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenActivity" ADD CONSTRAINT "GardenActivity_weatherObservationId_fkey" FOREIGN KEY ("weatherObservationId") REFERENCES "WeatherObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvaluation" ADD CONSTRAINT "ActivityEvaluation_gardenActivityId_fkey" FOREIGN KEY ("gardenActivityId") REFERENCES "GardenActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvaluation" ADD CONSTRAINT "ActivityEvaluation_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvaluation" ADD CONSTRAINT "ActivityEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WateringSchedule" ADD CONSTRAINT "WateringSchedule_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoEvaluation" ADD CONSTRAINT "PhotoEvaluation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoEvaluation" ADD CONSTRAINT "PhotoEvaluation_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthStage" ADD CONSTRAINT "GrowthStage_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherObservation" ADD CONSTRAINT "WeatherObservation_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyForecast" ADD CONSTRAINT "HourlyForecast_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyForecast" ADD CONSTRAINT "DailyForecast_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provinces" ADD CONSTRAINT "Provinces_administrative_unit_id_fkey" FOREIGN KEY ("administrative_unit_id") REFERENCES "AdministrativeUnits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provinces" ADD CONSTRAINT "Provinces_administrative_region_id_fkey" FOREIGN KEY ("administrative_region_id") REFERENCES "AdministrativeRegions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Districts" ADD CONSTRAINT "Districts_province_code_fkey" FOREIGN KEY ("province_code") REFERENCES "Provinces"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Districts" ADD CONSTRAINT "Districts_administrative_unit_id_fkey" FOREIGN KEY ("administrative_unit_id") REFERENCES "AdministrativeUnits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wards" ADD CONSTRAINT "Wards_district_code_fkey" FOREIGN KEY ("district_code") REFERENCES "Districts"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wards" ADD CONSTRAINT "Wards_administrative_unit_id_fkey" FOREIGN KEY ("administrative_unit_id") REFERENCES "AdministrativeUnits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_gardenerId_fkey" FOREIGN KEY ("gardenerId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_Post_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_Comment_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "Gardener"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
