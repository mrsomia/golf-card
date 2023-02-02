/*
  Warnings:

  - Added the required column `userId` to the `UserScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserScore" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
