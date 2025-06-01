/*
  Warnings:

  - You are about to drop the column `targetId` on the `Vote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gardenerId,targetType,postId,commentId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_Comment_targetId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_Post_targetId_fkey";

-- DropIndex
DROP INDEX "Vote_gardenerId_targetType_targetId_key";

-- DropIndex
DROP INDEX "Vote_targetType_targetId_idx";

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "targetId",
ADD COLUMN     "commentId" INTEGER,
ADD COLUMN     "postId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Vote_gardenerId_targetType_postId_commentId_key" ON "Vote"("gardenerId", "targetType", "postId", "commentId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
