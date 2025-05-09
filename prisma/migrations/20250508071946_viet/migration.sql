/*
  Warnings:

  - Made the column `optimalPHMin` on table `GrowthStage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `optimalPHMax` on table `GrowthStage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `optimalLightMin` on table `GrowthStage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `optimalLightMax` on table `GrowthStage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GrowthStage" ALTER COLUMN "optimalPHMin" SET NOT NULL,
ALTER COLUMN "optimalPHMax" SET NOT NULL,
ALTER COLUMN "optimalLightMin" SET NOT NULL,
ALTER COLUMN "optimalLightMax" SET NOT NULL;
