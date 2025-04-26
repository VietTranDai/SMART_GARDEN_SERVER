/*
  Warnings:

  - The values [CROP_CONDITION] on the enum `AlertType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cropDuration` on the `Garden` table. All the data in the column will be lost.
  - You are about to drop the column `cropName` on the `Garden` table. All the data in the column will be lost.
  - You are about to drop the column `cropStage` on the `Garden` table. All the data in the column will be lost.
  - You are about to drop the column `cropStartDate` on the `Garden` table. All the data in the column will be lost.
  - You are about to drop the column `cropName` on the `GardenActivity` table. All the data in the column will be lost.
  - You are about to drop the column `growthStage` on the `GardenActivity` table. All the data in the column will be lost.
  - You are about to drop the column `plantId` on the `PhotoEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `plantId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `WateringSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `plantId` on the `WateringSchedule` table. All the data in the column will be lost.
  - Added the required column `maxXP` to the `ExperienceLevel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GardenStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GardenType" AS ENUM ('INDOOR', 'OUTDOOR', 'BALCONY', 'ROOFTOP', 'WINDOW_SILL');

-- AlterEnum
BEGIN;
CREATE TYPE "AlertType_new" AS ENUM ('WEATHER', 'SENSOR_ERROR', 'SYSTEM', 'PLANT_CONDITION', 'ACTIVITY', 'MAINTENANCE', 'SECURITY', 'OTHER');
ALTER TABLE "Alert" ALTER COLUMN "type" TYPE "AlertType_new" USING ("type"::text::"AlertType_new");
ALTER TYPE "AlertType" RENAME TO "AlertType_old";
ALTER TYPE "AlertType_new" RENAME TO "AlertType";
DROP TYPE "AlertType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PhotoEvaluation" DROP CONSTRAINT "PhotoEvaluation_plantId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_plantId_fkey";

-- DropForeignKey
ALTER TABLE "WateringSchedule" DROP CONSTRAINT "WateringSchedule_plantId_fkey";

-- DropIndex
DROP INDEX "Garden_cropName_idx";

-- DropIndex
DROP INDEX "Garden_cropStage_idx";

-- DropIndex
DROP INDEX "PhotoEvaluation_plantId_evaluatedAt_idx";

-- DropIndex
DROP INDEX "Post_score_idx";

-- AlterTable
ALTER TABLE "ExperienceLevel" ADD COLUMN     "maxXP" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Garden" DROP COLUMN "cropDuration",
DROP COLUMN "cropName",
DROP COLUMN "cropStage",
DROP COLUMN "cropStartDate",
ADD COLUMN     "plantDuration" INTEGER,
ADD COLUMN     "plantGrowStage" TEXT,
ADD COLUMN     "plantName" TEXT,
ADD COLUMN     "plantStartDate" TIMESTAMP(3),
ADD COLUMN     "status" "GardenStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" "GardenType" NOT NULL DEFAULT 'OUTDOOR';

-- AlterTable
ALTER TABLE "GardenActivity" DROP COLUMN "cropName",
DROP COLUMN "growthStage",
ADD COLUMN     "plantGrowStage" TEXT,
ADD COLUMN     "plantName" TEXT;

-- AlterTable
ALTER TABLE "GrowthStage" ADD COLUMN     "optimalLightMax" DOUBLE PRECISION,
ADD COLUMN     "optimalLightMin" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PhotoEvaluation" DROP COLUMN "plantId",
ADD COLUMN     "plantGrowStage" TEXT,
ADD COLUMN     "plantName" TEXT,
ALTER COLUMN "evaluatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "plantId",
DROP COLUMN "score",
ADD COLUMN     "plantGrowStage" TEXT,
ADD COLUMN     "plantName" TEXT,
ADD COLUMN     "total_vote" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Wards" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WateringSchedule" DROP COLUMN "method",
DROP COLUMN "plantId";

-- CreateIndex
CREATE INDEX "Garden_plantName_idx" ON "Garden"("plantName");

-- CreateIndex
CREATE INDEX "Garden_plantGrowStage_idx" ON "Garden"("plantGrowStage");

-- CreateIndex
CREATE INDEX "PhotoEvaluation_plantName_evaluatedAt_idx" ON "PhotoEvaluation"("plantName", "evaluatedAt");

-- CreateIndex
CREATE INDEX "Post_total_vote_idx" ON "Post"("total_vote");
