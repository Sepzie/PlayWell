/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('ROGUELIKE', 'SHOOTER', 'DECKBUILDER', 'PLATFORMER');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "category" "Genre" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamingSession" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,

    CONSTRAINT "GamingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Limit" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'daily',
    "limitMinutes" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamingSession" ADD CONSTRAINT "GamingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamingSession" ADD CONSTRAINT "GamingSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Limit" ADD CONSTRAINT "Limit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Limit" ADD CONSTRAINT "Limit_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
