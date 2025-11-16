/*
  Warnings:

  - You are about to alter the column `durationMinutes` on the `GamingSession` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `limitMinutes` on the `Limit` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "GamingSession" ALTER COLUMN "durationMinutes" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Limit" ALTER COLUMN "limitMinutes" SET DEFAULT 1,
ALTER COLUMN "limitMinutes" SET DATA TYPE INTEGER;
