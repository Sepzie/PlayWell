const { connectDb, disconnectDb } = require('./dbService.js');
const { GameTracker } = require('./workers/gameTracker.js');
const { UserRepository } = require('./repository/user.js');
const { GameRepository } = require('./repository/game.js');
const timer = require('./workers/timerController.js');
const { NotificationService } = require('./services/notificationService.js');
const { debug_colors } = require('./debugColors.js');
const { server, reset, err } = debug_colors;

// Instantiate GameTracker (no dependencies)
const gameTracker = new GameTracker();

// Wire up coordination: when gaming state changes, update timer
gameTracker.on('gaming-state-changed', ({ isGaming }) => {
  try {
    timer.setGamingState(isGaming);
  } catch (e) {
    console.error(`${server}[index.js]${err} Timer gaming state update error:${reset}`, e);
  }
});

// Wire up notification events
gameTracker.on('new-game-detected', ({ gameName }) => {
  try {
    NotificationService.notifyNewGameDetected(gameName);
  } catch (e) {
    console.error(`${server}[index.js]${err} New game notification error:${reset}`, e);
  }
});

gameTracker.on('game-started', ({ gameName }) => {
  try {
    NotificationService.notifyGameStarted(gameName);
  } catch (e) {
    console.error(`${server}[index.js]${err} Game started notification error:${reset}`, e);
  }
});

gameTracker.on('game-stopped', ({ gameName, durationSeconds }) => {
  try {
    NotificationService.notifyGameStopped(gameName, durationSeconds);
  } catch (e) {
    console.error(`${server}[index.js]${err} Game stopped notification error:${reset}`, e);
  }
});

async function startBackground() {
  await connectDb();
  await UserRepository.loadNewOrReturningUser("Elsa Prisma");

  console.info(`${server}[index.js]${reset} Starting background process...`);
  gameTracker.startTracking();
  timer.start(); // Start the timer to track limits
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

