-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- DropForeignKey
ALTER TABLE "Limit" DROP CONSTRAINT "Limit_gameId_fkey";

-- AlterTable
ALTER TABLE "Limit" DROP COLUMN "gameId";
ALTER TABLE "Limit" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Limit" ALTER COLUMN "type" SET DATA TYPE "DayOfWeek" USING (type::"DayOfWeek");
ALTER TABLE "Limit" ALTER COLUMN "limitMinutes" SET DEFAULT 60;

-- CreateIndex
CREATE UNIQUE INDEX "Limit_userId_type_key" ON "Limit"("userId", "type");
