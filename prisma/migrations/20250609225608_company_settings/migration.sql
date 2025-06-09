-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "enable_1on1s" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_feedback_requests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_note_to_self" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_okrs" BOOLEAN NOT NULL DEFAULT true;
