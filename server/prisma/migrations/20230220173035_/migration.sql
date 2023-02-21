/*
  Warnings:

  - A unique constraint covering the columns `[roomId,number]` on the table `Hole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `Hole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hole" ADD COLUMN     "number" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Hole_roomId_number_key" ON "Hole"("roomId", "number");
