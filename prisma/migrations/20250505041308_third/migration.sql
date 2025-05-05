/*
  Warnings:

  - Added the required column `name` to the `Sensor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Sensor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SensorUnit" AS ENUM ('PERCENT', 'CELSIUS', 'LUX', 'METER', 'MILLIMETER', 'PH');

-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "unit" "SensorUnit" NOT NULL;
