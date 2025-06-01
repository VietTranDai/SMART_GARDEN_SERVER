/*
  Warnings:

  - A unique constraint covering the columns `[gardenerId,postId,commentId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Vote_gardenerId_targetType_postId_commentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Vote_gardenerId_postId_commentId_key" ON "Vote"("gardenerId", "postId", "commentId");
