-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_visibility_id_fkey";

-- AlterTable
ALTER TABLE "feedback" ALTER COLUMN "visibility_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_visibility_id_fkey" FOREIGN KEY ("visibility_id") REFERENCES "lookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
