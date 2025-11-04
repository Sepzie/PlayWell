// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample game data with various genres
const SAMPLE_GAMES = [
  { name: 'Dark Souls III', platform: 'Steam (PC)', genre: 'SURVIVAL' },
  { name: 'Elden Ring', platform: 'Steam (PC)', genre: 'SURVIVAL' },
  { name: 'The Binding of Isaac', platform: 'Steam (PC)', genre: 'ROGUELIKE' },
  { name: 'Hades', platform: 'Steam (PC)', genre: 'ROGUELIKE' },
  { name: 'Dead Cells', platform: 'Steam (PC)', genre: 'ROGUELIKE' },
  { name: 'Slay the Spire', platform: 'Steam (PC)', genre: 'DECKBUILDER' },
  { name: 'Monster Train', platform: 'Steam (PC)', genre: 'DECKBUILDER' },
  { name: 'Inscryption', platform: 'Steam (PC)', genre: 'DECKBUILDER' },
  { name: 'Counter-Strike 2', platform: 'Steam (PC)', genre: 'SHOOTER' },
  { name: 'Valorant', platform: 'Riot Games', genre: 'SHOOTER' },
  { name: 'Apex Legends', platform: 'Steam (PC)', genre: 'SHOOTER' },
  { name: 'Doom Eternal', platform: 'Steam (PC)', genre: 'SHOOTER' },
  { name: 'Celeste', platform: 'Steam (PC)', genre: 'PLATFORMER' },
  { name: 'Hollow Knight', platform: 'Steam (PC)', genre: 'PLATFORMER' },
  { name: 'Ori and the Will of the Wisps', platform: 'Steam (PC)', genre: 'PLATFORMER' },
  { name: 'Cuphead', platform: 'Steam (PC)', genre: 'PLATFORMER' },
  { name: 'Risk of Rain 2', platform: 'Steam (PC)', genre: 'ROGUELIKE' },
  { name: 'Enter the Gungeon', platform: 'Steam (PC)', genre: 'ROGUELIKE' },
  { name: 'Sekiro: Shadows Die Twice', platform: 'Steam (PC)', genre: 'SURVIVAL' },
  { name: 'The Witcher 3', platform: 'Steam (PC)', genre: 'SURVIVAL' },
  { name: 'Minecraft', platform: 'Steam (PC)', genre: 'SURVIVAL' },
  { name: 'Terraria', platform: 'Steam (PC)', genre: 'PLATFORMER' },
  { name: 'Portal 2', platform: 'Steam (PC)', genre: 'PLATFORMER' },
  { name: 'Titanfall 2', platform: 'Steam (PC)', genre: 'SHOOTER' },
  { name: 'Destiny 2', platform: 'Steam (PC)', genre: 'SHOOTER' },
  { name: 'Balatro', platform: 'Steam (PC)', genre: 'DECKBUILDER' },
  { name: 'Darkest Dungeon', platform: 'Steam (PC)', genre: 'ROGUELIKE' },
  { name: 'Bloodborne', platform: 'PlayStation', genre: 'SURVIVAL' },
  { name: 'Stardew Valley', platform: 'Steam (PC)', genre: 'NOGENRE' },
  { name: 'Among Us', platform: 'Steam (PC)', genre: 'NOGENRE' },
];

// Helper to generate random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to generate realistic session duration (30 mins to 4 hours)
function randomSessionDuration() {
  // Weighted towards 1-2 hour sessions
  const weights = [
    { min: 30, max: 60, weight: 0.2 },    // Short sessions: 30-60 mins
    { min: 60, max: 120, weight: 0.4 },   // Medium sessions: 1-2 hours
    { min: 120, max: 180, weight: 0.3 },  // Long sessions: 2-3 hours
    { min: 180, max: 240, weight: 0.1 },  // Very long sessions: 3-4 hours
  ];

  const random = Math.random();
  let cumWeight = 0;

  for (const w of weights) {
    cumWeight += w.weight;
    if (random <= cumWeight) {
      return Math.floor(Math.random() * (w.max - w.min) + w.min);
    }
  }

  return 90; // Default
}

// Generate game popularity weights (some games played more than others)
function generateGameWeights(games) {
  const weights = {};
  games.forEach(game => {
    // Random weight between 0.5 and 10 (exponential distribution for realism)
    weights[game.name] = Math.pow(Math.random(), 2) * 9.5 + 0.5;
  });
  return weights;
}

// Pick a random game based on weights
function pickWeightedGame(games, weights) {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const game of games) {
    random -= weights[game.name];
    if (random <= 0) {
      return game;
    }
  }

  return games[0];
}

async function main() {
  console.log('Starting seed...');

  // Get or create the default user
  let user = await prisma.user.findUnique({
    where: { username: 'Elsa Prisma' }
  });

  if (!user) {
    console.log('Creating user "Elsa Prisma"...');
    user = await prisma.user.create({
      data: { username: 'Elsa Prisma' }
    });
  }

  console.log(`Using user: ${user.username} (ID: ${user.id})`);

  // Create games
  console.log('Creating games...');
  const createdGames = [];
  for (const gameData of SAMPLE_GAMES) {
    const game = await prisma.game.upsert({
      where: { name: gameData.name },
      update: {},
      create: {
        name: gameData.name,
        location: `C:\\Program Files\\${gameData.name.replace(/[^a-zA-Z0-9]/g, '')}\\game.exe`,
        platform: gameData.platform,
        category: gameData.genre,
        userId: user.id
      }
    });
    createdGames.push(game);
  }
  console.log(`Created ${createdGames.length} games`);

  // Generate gaming sessions for the past 5 years
  console.log('Generating gaming sessions for the past 5 years...');

  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());

  const gameWeights = generateGameWeights(createdGames);
  const sessions = [];

  // Generate sessions with more recent activity
  // Use exponential distribution: more sessions in recent times
  const totalSessions = 800; // About 160 sessions per year, ~3 per week

  for (let i = 0; i < totalSessions; i++) {
    // Exponential distribution: recent dates more likely
    const randomValue = Math.random();
    const exponentialValue = Math.pow(randomValue, 0.3); // Lower power = more recent bias
    const sessionDate = new Date(
      fiveYearsAgo.getTime() + exponentialValue * (now.getTime() - fiveYearsAgo.getTime())
    );

    // Weekend boost: 1.5x more likely on weekends
    const dayOfWeek = sessionDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend && Math.random() < 0.2) {
      continue; // Skip some weekday sessions
    }

    // Pick a game based on weights
    const game = pickWeightedGame(createdGames, gameWeights);
    const duration = randomSessionDuration();

    // Set realistic time of day (more gaming in evenings)
    const hour = Math.floor(Math.random() * 8) + 14; // 2 PM to 10 PM
    const minute = Math.floor(Math.random() * 60);
    sessionDate.setHours(hour, minute, 0, 0);

    const startTime = new Date(sessionDate);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    sessions.push({
      gameId: game.id,
      userId: user.id,
      startTime,
      endTime,
      durationMinutes: duration
    });
  }

  // Sort sessions by date
  sessions.sort((a, b) => a.startTime - b.startTime);

  // Insert sessions in batches
  const batchSize = 100;
  for (let i = 0; i < sessions.length; i += batchSize) {
    const batch = sessions.slice(i, i + batchSize);
    await prisma.gamingSession.createMany({
      data: batch
    });
    console.log(`Inserted sessions ${i + 1} to ${Math.min(i + batchSize, sessions.length)}`);
  }

  console.log(`Created ${sessions.length} gaming sessions`);

  // Create weekly limits (some days with limits, some without)
  console.log('Creating weekly gaming limits...');

  const limits = [
    { type: 'MONDAY', limitMinutes: 120 },
    { type: 'TUESDAY', limitMinutes: 120 },
    { type: 'WEDNESDAY', limitMinutes: 90 },
    { type: 'THURSDAY', limitMinutes: 120 },
    { type: 'FRIDAY', limitMinutes: 180 },
    { type: 'SATURDAY', limitMinutes: 240 },
    { type: 'SUNDAY', limitMinutes: 240 },
  ];

  for (const limitData of limits) {
    await prisma.limit.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: limitData.type
        }
      },
      update: {
        limitMinutes: limitData.limitMinutes
      },
      create: {
        userId: user.id,
        type: limitData.type,
        limitMinutes: limitData.limitMinutes
      }
    });
  }

  console.log('Created weekly limits');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
