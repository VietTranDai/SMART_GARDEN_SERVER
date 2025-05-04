/*
  Warnings:

  - You are about to drop the column `dewPoint` on the `DailyForecast` table. All the data in the column will be lost.
  - You are about to drop the column `uvi` on the `DailyForecast` table. All the data in the column will be lost.
  - You are about to drop the column `dewPoint` on the `HourlyForecast` table. All the data in the column will be lost.
  - You are about to drop the column `uvi` on the `HourlyForecast` table. All the data in the column will be lost.
  - You are about to drop the column `dewPoint` on the `WeatherObservation` table. All the data in the column will be lost.
  - You are about to drop the column `uvi` on the `WeatherObservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailyForecast" DROP COLUMN "dewPoint",
DROP COLUMN "uvi";

-- AlterTable
ALTER TABLE "HourlyForecast" DROP COLUMN "dewPoint",
DROP COLUMN "uvi";

-- AlterTable
ALTER TABLE "WeatherObservation" DROP COLUMN "dewPoint",
DROP COLUMN "uvi";
