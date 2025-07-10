/*
  Warnings:

  - You are about to drop the column `note_to_self` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `meetings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meetings" DROP COLUMN "note_to_self",
DROP COLUMN "notes";
