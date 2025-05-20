-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_requests" DROP CONSTRAINT "feedback_requests_recipient_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_requests" DROP CONSTRAINT "feedback_requests_requester_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_requests" DROP CONSTRAINT "feedback_requests_target_user_id_fkey";

-- DropForeignKey
ALTER TABLE "meeting_attendees" DROP CONSTRAINT "meeting_attendees_user_id_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_scheduled_by_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_auth" DROP CONSTRAINT "user_auth_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_details" DROP CONSTRAINT "user_details_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_okrs" DROP CONSTRAINT "user_okrs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- AlterTable
ALTER TABLE "feedback" ALTER COLUMN "receiver_id" DROP NOT NULL,
ALTER COLUMN "sender_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "feedback_requests" ALTER COLUMN "recipient_id" DROP NOT NULL,
ALTER COLUMN "requester_id" DROP NOT NULL,
ALTER COLUMN "target_user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "meetings" ALTER COLUMN "scheduled_by_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user_auth" ADD CONSTRAINT "user_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_okrs" ADD CONSTRAINT "user_okrs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_scheduled_by_id_fkey" FOREIGN KEY ("scheduled_by_id") REFERENCES "user_details"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
