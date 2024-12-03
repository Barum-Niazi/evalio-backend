/*
  Warnings:

  - You are about to drop the column `visibility` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `feedback_requests` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `tagged_entities` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `tags` table. All the data in the column will be lost.
  - Added the required column `visibility_id` to the `feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `feedback_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_id` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feedback" DROP COLUMN "visibility",
ADD COLUMN     "visibility_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "feedback_requests" DROP COLUMN "status",
ADD COLUMN     "status_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "status_id" INTEGER NOT NULL,
ADD COLUMN     "type_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "tagged_entities" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "metadata";

-- DropEnum
DROP TYPE "notification_status";

-- DropEnum
DROP TYPE "notification_type";

-- DropEnum
DROP TYPE "request_status";

-- DropEnum
DROP TYPE "visibility";

-- CreateTable
CREATE TABLE "lookup_category" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "audit" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "lookup_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "metadata" JSONB,
    "audit" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "lookup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lookup_category_code_key" ON "lookup_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_code_key" ON "lookup"("code");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_visibility_id_fkey" FOREIGN KEY ("visibility_id") REFERENCES "lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "lookup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup_category" ADD CONSTRAINT "lookup_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "lookup_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup" ADD CONSTRAINT "lookup_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "lookup_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup" ADD CONSTRAINT "lookup_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "lookup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
