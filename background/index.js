const { connectDb, disconnectDb } = require('./dbService.js');
const { GameTracker } = require('./gameTracker.js');
const { UserRepository } = require('./repository/user.js');
const { GameRepository } = require('./repository/game.js');
const { debug_colors } = require('../src/theme/colors.js');
const { server, reset, err } = debug_colors;



async function startBackground() {
  connectDb();
  await UserRepository.loadNewOrReturningUser("Elsa Prisma");

  console.info(`${server}[index.js]${reset} Starting background process...`);
  GameTracker.startTracking();
  console.info(`${server}[index.js]${reset} Background processes started`);
}

function stopBackground() {
  console.info(`${server}[index.js]${reset} Stopping background processes...`);
  
  GameTracker.stopTracking();
  let disconnectPromise = disconnectDb()

  // Add promises here to sync after all asynchronous calls
  Promise.all([disconnectPromise])    
    .then(() => {
        console.info(`${server}[index.js]${reset} Background process stopped`);
    })
    .catch((error) => {
        console.error(`${server}[index.js]${err} ${error}${reset}`)
    });
}

module.exports = { startBackground, stopBackground };

