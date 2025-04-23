-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('HUMIDITY', 'TEMPERATURE', 'LIGHT', 'WATER_LEVEL', 'RAINFALL', 'SOIL_MOISTURE', 'SOIL_PH');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('PLANTING', 'WATERING', 'FERTILIZING', 'PRUNING', 'HARVESTING', 'PEST_CONTROL', 'SOIL_TESTING', 'WEEDING', 'OTHER');

-- CreateEnum
CREATE TYPE "EvaluatorType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WeatherMain" AS ENUM ('THUNDERSTORM', 'DRIZZLE', 'RAIN', 'SNOW', 'ATMOSPHERE', 'CLEAR', 'CLOUDS');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('WEATHER', 'SENSOR_ERROR', 'SYSTEM', 'CROP_CONDITION', 'ACTIVITY', 'MAINTENANCE', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'IGNORED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "NotificationMethod" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'NONE');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "roleId" INTEGER NOT NULL,
    "refreshToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "profilePicture" TEXT,
    "address" TEXT,
    "bio" TEXT,
    "experienceLevel" "ExperienceLevel",
    "yearsOfExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmLab" (
    "id" SERIAL NOT NULL,
    "farmLabKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "ward" TEXT,
    "district" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "farmerId" INTEGER NOT NULL,
    "cropName" TEXT,
    "cropStage" TEXT,
    "cropStartDate" TIMESTAMP(3),
    "cropDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmLab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "sensorKey" TEXT NOT NULL,
    "type" "SensorType" NOT NULL,
    "farmLabId" INTEGER NOT NULL,
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
    "farmLabId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SensorData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmActivity" (
    "id" SERIAL NOT NULL,
    "farmLabId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "cropName" TEXT,
    "growthStage" TEXT,
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

    CONSTRAINT "FarmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvaluation" (
    "id" SERIAL NOT NULL,
    "farmActivityId" INTEGER NOT NULL,
    "evaluatorType" "EvaluatorType" NOT NULL,
    "userId" INTEGER,
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

    CONSTRAINT "ActivityEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "family" TEXT,
    "description" TEXT,
    "growthDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthStage" (
    "id" SERIAL NOT NULL,
    "plantTypeId" INTEGER NOT NULL,
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
    "farmLabId" INTEGER NOT NULL,
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
    "farmLabId" INTEGER NOT NULL,
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
    "farmLabId" INTEGER NOT NULL,
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

    CONSTRAINT "Wards_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "farmLabId" INTEGER NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FarmLab_farmLabKey_key" ON "FarmLab"("farmLabKey");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_sensorKey_key" ON "Sensor"("sensorKey");

-- CreateIndex
CREATE INDEX "SensorData_sensorId_timestamp_idx" ON "SensorData"("sensorId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PlantType_name_key" ON "PlantType"("name");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmLab" ADD CONSTRAINT "FarmLab_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_farmLabId_fkey" FOREIGN KEY ("farmLabId") REFERENCES "FarmLab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorData" ADD CONSTRAINT "SensorData_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorData" ADD CONSTRAINT "SensorData_farmLabId_fkey" FOREIGN KEY ("farmLabId") REFERENCES "FarmLab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmActivity" ADD CONSTRAINT "FarmActivity_farmLabId_fkey" FOREIGN KEY ("farmLabId") REFERENCES "FarmLab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmActivity" ADD CONSTRAINT "FarmActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmActivity" ADD CONSTRAINT "FarmActivity_weatherObservationId_fkey" FOREIGN KEY ("weatherObservationId") REFERENCES "WeatherObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvaluation" ADD CONSTRAINT "ActivityEvaluation_farmActivityId_fkey" FOREIGN KEY ("farmActivityId") REFERENCES "FarmActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvaluation" ADD CONSTRAINT "ActivityEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthStage" ADD CONSTRAINT "GrowthStage_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherObservation" ADD CONSTRAINT "WeatherObservation_farmLabId_fkey" FOREIGN KEY ("farmLabId") REFERENCES "FarmLab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyForecast" ADD CONSTRAINT "HourlyForecast_farmLabId_fkey" FOREIGN KEY ("farmLabId") REFERENCES "FarmLab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyForecast" ADD CONSTRAINT "DailyForecast_farmLabId_fkey" FOREIGN KEY ("farmLabId") REFERENCES "FarmLab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_farmLabId_fkey" FOREIGN KEY ("farmLabId") REFERENCES "FarmLab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
