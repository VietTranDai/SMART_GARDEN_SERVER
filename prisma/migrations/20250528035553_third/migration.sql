/*
  Warnings:

  - Added the required column `gardenId` to the `PhotoEvaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PhotoEvaluation" ADD COLUMN     "gardenId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PhotoEvaluation" ADD CONSTRAINT "PhotoEvaluation_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
