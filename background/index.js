const { connectDb, disconnectDb } = require('./dbService.js');
const { GameTracker } = require('./gameTracker.js');
const { UserRepository } = require('./repository/user.js');
const { GameRepository } = require('./repository/game.js');
const { debug_colors } = require('../src/theme/colors.js');
const { server, reset, err } = debug_colors;
const { Genre } = require('@prisma/client');


async function startBackground() {
  connectDb();
  await UserRepository.loadNewOrReturningUser("Elsa Prisma");

  // TEST GameRepository from index.js
  // const tmp1 = GameRepository.createGame("Mario Kart World", "C:\\Program Files (x86)\\BowserOS", "Nintendo Switch 2", Genre.SHOOTER);
  // const tmp2 = GameRepository.createGame("Inscryption", "C:\\Program Files (x86)\\SteamDeck", "Steam Deck", Genre.DECKBUILDER);

  // const tmp3 = GameRepository.createGame("This War of Mine", "C:\\Program Files (x86)\\Steam\\steamapps\\common\\This War of Mine\\x64\\This War of Mine.exe", "Steam", Genre.ROGUELIKE);
  // await Promise.all([tmp1, tmp2, tmp3]);
  const games = await GameRepository.getAllGames();
  console.info(`${server}[index.js]${reset} All games: `, games);

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

