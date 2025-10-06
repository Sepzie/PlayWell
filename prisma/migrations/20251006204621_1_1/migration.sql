-- DropForeignKey
ALTER TABLE "public"."Game" DROP CONSTRAINT "Game_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GamingSession" DROP CONSTRAINT "GamingSession_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GamingSession" DROP CONSTRAINT "GamingSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Limit" DROP CONSTRAINT "Limit_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Limit" DROP CONSTRAINT "Limit_userId_fkey";
