/*
  Warnings:

  - You are about to drop the column `Due_date` on the `okrs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "okrs" DROP COLUMN "Due_date",
ADD COLUMN     "due_date" TIMESTAMP(3);
