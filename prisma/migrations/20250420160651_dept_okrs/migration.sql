-- AlterTable
ALTER TABLE "okrs" ADD COLUMN     "department_id" INTEGER;

-- AddForeignKey
ALTER TABLE "okrs" ADD CONSTRAINT "okrs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
