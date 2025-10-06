const { getPrisma } = require('./prismaClient.js');
const { PrismaClient } = require('@prisma/client');

async function connectDb() {
  console.log('Database connection started');
  
  // Example of how this will be implemented:
  const prisma = await new PrismaClient();
  await prisma.$connect();

  // await prisma.user.delete({
  //   where: {id: 2}
  // })

  // await prisma.user.create({
  //   data: {
  //     id:  2,
  //     username: 'Elsa Prisma',
  //   },
  // })
  // await prisma.game.create({
  //   data: {
  //     id: "codmw3",
  //     name: 'Call of Duty MW3',
  //     userId: 2,
  //     location: 'MyGames',
  //     platform: 'Steam',
  //     category: 'SHOOTER'
  //   }
  // });
  // await prisma.gamingSession.create({
  //     data: {
  //       durationMinutes: 64,
  //       userId: 2,
  //       gameId: 'codmw3'
  //     }
  // })
  // await prisma.limit.create({
  //     data: {
  //       limitMinutes: 90,
  //       userId: 2,
  //       gameId: 'codmw3'
  //     }
  // })

  // TODO: Add async/await success/fail/error handling or the ES6 equivalent with await
  res = await prisma.user.findMany();
  console.log("Users: ", res);
  res = await prisma.game.findMany();
  console.log("Games: ", res);
  res = await prisma.gamingSession.findMany();
  console.log("Gaming Sessions: ", res);
  res = await prisma.limit.findMany();
  console.log("Limits: ", res);
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


