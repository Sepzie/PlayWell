const { connectDb, disconnectDb } = require('./dbService.js');
const { GameTracker } = require('./workers/gameTracker.js');
const { UserRepository } = require('./repository/user.js');
const { GameRepository } = require('./repository/game.js');
const timer = require('./workers/timerController.js');
const { debug_colors } = require('../src/theme/colors.js');
const { server, reset, err } = debug_colors;

// Instantiate GameTracker (no dependencies)
const gameTracker = new GameTracker();

// Wire up coordination: when gaming state changes, control the timer
gameTracker.on('gaming-state-changed', ({ isGaming }) => {
  try {
    if (isGaming) {
      console.info(`${server}[index.js]${reset} Gaming detected, resuming timer`);
      timer.resume();
    } else {
      console.info(`${server}[index.js]${reset} No games detected, pausing timer`);
      timer.pause();
    }
  } catch (e) {
    console.error(`${server}[index.js]${err} Timer control error:`, e, reset);
  }
});

async function startBackground() {
  connectDb();
  await UserRepository.loadNewOrReturningUser("Elsa Prisma");

  console.info(`${server}[index.js]${reset} Starting background process...`);
  gameTracker.startTracking();
  console.info(`${server}[index.js]${reset} Background processes started`);
}

function stopBackground() {
  console.info(`${server}[index.js]${reset} Stopping background processes...`);

  gameTracker.stopTracking();
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

module.exports = { startBackground, stopBackground, gameTracker };

