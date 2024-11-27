/*
  Warnings:

  - The primary key for the `user_auth` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `user_auth` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_auth_userId_key";

-- AlterTable
CREATE SEQUENCE user_auth_userid_seq;
ALTER TABLE "user_auth" DROP CONSTRAINT "user_auth_pkey",
DROP COLUMN "id",
ALTER COLUMN "userId" SET DEFAULT nextval('user_auth_userid_seq'),
ADD CONSTRAINT "user_auth_pkey" PRIMARY KEY ("userId");
ALTER SEQUENCE user_auth_userid_seq OWNED BY "user_auth"."userId";
