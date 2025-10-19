const { connectDb, disconnectDb } = require('./dbService.js');
const { GameTracker } = require('./gameTracker.js');
const { UserRepository } = require('./repository/user.js');
const { debug_colors } = require('../src/theme/colors.js');
const { server, reset, err } = debug_colors;


async function startBackground() {
  connectDb();

  console.info(`${server}[index.js]${reset} Starting background process...`);

  GameTracker.startTracking();

  console.info(`${server}[index.js]${reset} Background processes started`);

  // TEST UserRepository from index.js
  // console.info(`${server}[index.js]${reset} Current user: `, UserRepository.getCurrentUser());
  // await UserRepository.getAllUsers();
  // await UserRepository.loadNewOrReturningUser("Eugene Prisma");
  // console.info(`${server}[index.js]${reset} Current user: `, UserRepository.getCurrentUser());
  // await UserRepository.loadNewOrReturningUser("Flint Prisma");
  // console.info(`${server}[index.js]${reset} Current user: `, UserRepository.getCurrentUser());
  // await UserRepository.getAllUsers();

  // TEST stopBackground
  // setTimeout(stopBackground, 1000 * 4);
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

