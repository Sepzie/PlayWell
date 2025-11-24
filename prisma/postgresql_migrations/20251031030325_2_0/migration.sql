-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Genre" ADD VALUE 'NOGENRE';
ALTER TYPE "Genre" ADD VALUE 'SURVIVAL';

-- AlterTable
ALTER TABLE "GamingSession" ALTER COLUMN "durationMinutes" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Limit" ALTER COLUMN "limitMinutes" SET DEFAULT 1,
ALTER COLUMN "limitMinutes" SET DATA TYPE DECIMAL(65,30);
