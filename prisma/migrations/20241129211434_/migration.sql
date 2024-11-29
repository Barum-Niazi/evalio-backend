/*
  Warnings:

  - You are about to drop the column `adminId` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `allowAnonymousFeedback` on the `company_settings` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `company_settings` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `department` table. All the data in the column will be lost.
  - You are about to drop the column `feedbackText` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `isAnonymous` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `feedback` table. All the data in the column will be lost.
  - The `visibility` column on the `feedback` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `recipientId` on the `feedback_requests` table. All the data in the column will be lost.
  - You are about to drop the column `requesterId` on the `feedback_requests` table. All the data in the column will be lost.
  - The `status` column on the `feedback_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `okrId` on the `key_results` table. All the data in the column will be lost.
  - The primary key for the `meeting_attendees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `meetingId` on the `meeting_attendees` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `meeting_attendees` table. All the data in the column will be lost.
  - You are about to drop the column `noteToSelf` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledById` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notifications` table. All the data in the column will be lost.
  - The `status` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `companyId` on the `okrs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `okrs` table. All the data in the column will be lost.
  - The primary key for the `user_auth` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `provider` on the `user_auth` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `user_auth` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_auth` table. All the data in the column will be lost.
  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `designationId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `managerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[company_id]` on the table `company_settings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `company_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feedback_text` to the `feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiver_id` to the `feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_id` to the `feedback_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requester_id` to the `feedback_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `okr_id` to the `key_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meeting_id` to the `meeting_attendees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `meeting_attendees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduled_at` to the `meetings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduled_by_id` to the `meetings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `user_id` to the `user_auth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_roles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('SYSTEM', 'FEEDBACK', 'MEETING', 'OKR', 'GENERAL');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('UNREAD', 'READ');

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_adminId_fkey";

-- DropForeignKey
ALTER TABLE "company_settings" DROP CONSTRAINT "company_settings_companyId_fkey";

-- DropForeignKey
ALTER TABLE "department" DROP CONSTRAINT "department_companyId_fkey";

-- DropForeignKey
ALTER TABLE "department" DROP CONSTRAINT "department_headId_fkey";

-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_senderId_fkey";

-- DropForeignKey
ALTER TABLE "feedback_requests" DROP CONSTRAINT "feedback_requests_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "feedback_requests" DROP CONSTRAINT "feedback_requests_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "key_results" DROP CONSTRAINT "key_results_okrId_fkey";

-- DropForeignKey
ALTER TABLE "meeting_attendees" DROP CONSTRAINT "meeting_attendees_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "meeting_attendees" DROP CONSTRAINT "meeting_attendees_userId_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_scheduledById_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "okrs" DROP CONSTRAINT "okrs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "okrs" DROP CONSTRAINT "okrs_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_auth" DROP CONSTRAINT "user_auth_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_designationId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_managerId_fkey";

-- DropIndex
DROP INDEX "company_settings_companyId_key";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "adminId";

-- AlterTable
ALTER TABLE "company_settings" DROP COLUMN "allowAnonymousFeedback",
DROP COLUMN "companyId",
ADD COLUMN     "allow_anonymous_feedback" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "company_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "department" DROP COLUMN "companyId",
ADD COLUMN     "company_id" INTEGER;

-- AlterTable
ALTER TABLE "feedback" DROP COLUMN "feedbackText",
DROP COLUMN "isAnonymous",
DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "feedback_text" TEXT NOT NULL,
ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiver_id" INTEGER NOT NULL,
ADD COLUMN     "sender_id" INTEGER NOT NULL,
DROP COLUMN "visibility",
ADD COLUMN     "visibility" "visibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "feedback_requests" DROP COLUMN "recipientId",
DROP COLUMN "requesterId",
ADD COLUMN     "recipient_id" INTEGER NOT NULL,
ADD COLUMN     "requester_id" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "request_status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "key_results" DROP COLUMN "okrId",
ADD COLUMN     "okr_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "meeting_attendees" DROP CONSTRAINT "meeting_attendees_pkey",
DROP COLUMN "meetingId",
DROP COLUMN "userId",
ADD COLUMN     "meeting_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "meeting_attendees_pkey" PRIMARY KEY ("meeting_id", "user_id");

-- AlterTable
ALTER TABLE "meetings" DROP COLUMN "noteToSelf",
DROP COLUMN "scheduledAt",
DROP COLUMN "scheduledById",
ADD COLUMN     "note_to_self" TEXT,
ADD COLUMN     "scheduled_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "scheduled_by_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "notification_type" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "notification_status" NOT NULL DEFAULT 'UNREAD';

-- AlterTable
ALTER TABLE "okrs" DROP COLUMN "companyId",
DROP COLUMN "userId",
ADD COLUMN     "company_id" INTEGER,
ADD COLUMN     "user_id" INTEGER;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "audit" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "user_auth" DROP CONSTRAINT "user_auth_pkey",
DROP COLUMN "provider",
DROP COLUMN "providerId",
DROP COLUMN "userId",
ADD COLUMN     "audit" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "user_auth_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_pkey",
DROP COLUMN "userId",
ADD COLUMN     "audit" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "roleId");

-- AlterTable
ALTER TABLE "users" DROP COLUMN "companyId",
DROP COLUMN "departmentId",
DROP COLUMN "designationId",
DROP COLUMN "managerId",
DROP COLUMN "name";

-- DropEnum
DROP TYPE "NotificationStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "RequestStatus";

-- DropEnum
DROP TYPE "Visibility";

-- CreateTable
CREATE TABLE "user_details" (
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" INTEGER,
    "manager_id" INTEGER,
    "department_id" INTEGER,
    "designation_id" INTEGER,
    "audit" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_okrs" (
    "user_id" INTEGER NOT NULL,
    "okr_id" INTEGER NOT NULL,

    CONSTRAINT "user_okrs_pkey" PRIMARY KEY ("user_id","okr_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "company_settings"("company_id");

-- AddForeignKey
ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_headId_fkey" FOREIGN KEY ("headId") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "okrs" ADD CONSTRAINT "okrs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_okrs" ADD CONSTRAINT "user_okrs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_okrs" ADD CONSTRAINT "user_okrs_okr_id_fkey" FOREIGN KEY ("okr_id") REFERENCES "okrs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_okr_id_fkey" FOREIGN KEY ("okr_id") REFERENCES "okrs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_scheduled_by_id_fkey" FOREIGN KEY ("scheduled_by_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
