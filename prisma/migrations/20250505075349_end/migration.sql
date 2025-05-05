/*
  Warnings:

  - You are about to drop the column `notificationMethod` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Alert` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_gardenId_fkey";

-- AlterTable
ALTER TABLE "Alert" DROP COLUMN "notificationMethod",
DROP COLUMN "timestamp",
ADD COLUMN     "severity" "Severity" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "gardenId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "NotificationMethod";

-- CreateIndex
CREATE INDEX "Alert_gardenId_idx" ON "Alert"("gardenId");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
