-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Game" ("category", "createdAt", "id", "location", "name", "platform", "updatedAt", "userId") SELECT "category", "createdAt", "id", "location", "name", "platform", "updatedAt", "userId" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");
CREATE TABLE "new_GamingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "gameId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME NOT NULL,
    "durationSeconds" INTEGER
);
INSERT INTO "new_GamingSession" ("durationSeconds", "endTime", "gameId", "id", "startTime", "userId") SELECT "durationSeconds", "endTime", "gameId", "id", "startTime", "userId" FROM "GamingSession";
DROP TABLE "GamingSession";
ALTER TABLE "new_GamingSession" RENAME TO "GamingSession";
CREATE TABLE "new_Limit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "limitSeconds" INTEGER NOT NULL DEFAULT 3600
);
INSERT INTO "new_Limit" ("id", "limitSeconds", "type", "userId") SELECT "id", "limitSeconds", "type", "userId" FROM "Limit";
DROP TABLE "Limit";
ALTER TABLE "new_Limit" RENAME TO "Limit";
CREATE UNIQUE INDEX "Limit_userId_type_key" ON "Limit"("userId", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
