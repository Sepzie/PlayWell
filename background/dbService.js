const { getPrisma } = require('./prismaClient.js');
const { UserRepository } = require('./repository/user.js');
const { debug_colors } = require('../src/theme/colors.js');
const {repo, reset, err} = debug_colors;


async function connectDb() {
  console.log(`${repo}[DBService]${reset} Database connection started...`);
  
  try {
    await getPrisma().$connect();
  } catch (error) {
    console.error(`${repo}[DBService]${err} ${error}${reset}`);
    return;
  }
  console.info(`${repo}[DBService]${reset} Connected to DB!`);
  await UserRepository.getAllUsers();
  await UserRepository.loadNewOrReturningUser("Rapunzel Prisma");
  await UserRepository.getAllUsers();
  await UserRepository.loadNewOrReturningUser("Rapunzel Prisma");
  await UserRepository.getAllUsers();
  // UserRepository.loadNewOrReturningUser(1);
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


