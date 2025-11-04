-- AlterTable - Rename durationMinutes to durationSeconds and convert values
ALTER TABLE "GamingSession" RENAME COLUMN "durationMinutes" TO "durationSeconds";
UPDATE "GamingSession" SET "durationSeconds" = "durationSeconds" * 60 WHERE "durationSeconds" IS NOT NULL;

-- AlterTable - Rename limitMinutes to limitSeconds, convert values, and update default
ALTER TABLE "Limit" RENAME COLUMN "limitMinutes" TO "limitSeconds";
UPDATE "Limit" SET "limitSeconds" = "limitSeconds" * 60;
ALTER TABLE "Limit" ALTER COLUMN "limitSeconds" SET DEFAULT 3600;
