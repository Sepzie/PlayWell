const { getPrisma } = require('./prismaClient.js');
const { PrismaClient } = require('@prisma/client');

async function connectDb() {
  console.log('Database connection started');
  
  // Example of how this will be implemented:
  const prisma = await new PrismaClient();
  await prisma.$connect();

  // const user = await prisma.user.create({
  //   data: {
  //     username: 'Elsa Prisma',
  //   },
  // })

  // TODO: Add async/await success/fail/error handling or the ES6 equivalent with await
  res = await prisma.user.findMany();
  console.log("RESULTS: ", res);
}

function disconnectDb() {
  // TODO: Implement database disconnection logic
  console.log('Database disconnection started (placeholder)');
  
  // Example of how this will be implemented:
  // const prisma = getPrisma();
  // return prisma.$disconnect();
}

function saveGameSession(sessionData) {
  // TODO: Implement session saving
  console.log('Saving game session (placeholder):', sessionData);
}

function getGameSessions() {
  // TODO: Implement session retrieval
  console.log('Getting game sessions (placeholder)');
  return [];
}

module.exports = {
  connectDb,
  disconnectDb,
  saveGameSession,
  getGameSessions
};


