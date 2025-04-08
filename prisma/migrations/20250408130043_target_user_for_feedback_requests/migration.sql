/*
  Warnings:

  - Added the required column `target_user_id` to the `feedback_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feedback_requests" ADD COLUMN     "target_user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
