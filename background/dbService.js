const { getPrisma, disconnectPrisma } = require('./prismaClient.js');
const { UserRepository } = require('./repository/user.js');
const { debug_colors } = require('./debugColors.js');
const { repo, reset, err } = debug_colors;


async function connectDb() {
  console.log(`${repo}[DBService]${reset} Database connection started...`);

  try {
    await getPrisma().$connect();
  } catch (error) {
    console.error(`${repo}[DBService]${err} ${error}${reset}`);
    return;
  }
  console.info(`${repo}[DBService]${reset} Connected to DB!`);
}

async function disconnectDb() {
  console.log(`${repo}[DBService]${reset} Disconnecting from DB...`);
  try {
    UserRepository.unloadUser();
    await disconnectPrisma();
    console.info(`${repo}[DBService]${reset} Disconnected from DB!`);
  } catch (error) {
    console.error(`${repo}[DBService]${err} Error disconnecting:${reset}`, error);
  }
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


