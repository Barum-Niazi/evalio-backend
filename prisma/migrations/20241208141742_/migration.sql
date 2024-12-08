/*
  Warnings:

  - A unique constraint covering the columns `[name,company_id]` on the table `department` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "department_name_company_id_key" ON "department"("name", "company_id");
