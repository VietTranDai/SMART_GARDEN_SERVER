/*
  Warnings:

  - You are about to drop the column `wateringScheduleId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoEvaluation" DROP CONSTRAINT "PhotoEvaluation_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_wateringScheduleId_fkey";

-- AlterTable
ALTER TABLE "PhotoEvaluation" ADD COLUMN     "gardenActivityId" INTEGER;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "wateringScheduleId";

-- AlterTable
ALTER TABLE "WateringSchedule" ADD COLUMN     "gardenActivityId" INTEGER;

-- AddForeignKey
ALTER TABLE "WateringSchedule" ADD CONSTRAINT "WateringSchedule_gardenActivityId_fkey" FOREIGN KEY ("gardenActivityId") REFERENCES "GardenActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoEvaluation" ADD CONSTRAINT "PhotoEvaluation_gardenActivityId_fkey" FOREIGN KEY ("gardenActivityId") REFERENCES "GardenActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
