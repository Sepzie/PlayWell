const csv = require('csvtojson');
const { debug_colors } = require('../src/theme/colors.js');
const { proctracker, reset, err } = debug_colors;
const util = require('node:util');
const execFile = util.promisify(require('node:child_process').execFile);
const { GameRepository } = require('./repository/game.js');
const { GamingSessionRepository } = require('./repository/gamingSession.js');
const { Genre } = require('@prisma/client');

const INTERVAL_SECONDS = 3;
let background_pid;
let latestSnapshot = {}; // public Snapshot as an object {game_id: game_session}

// Structure of game processes
// {
//     Node: string,
//     CreationDate: string formatted as date,
//     ExecutablePath: string like path 'C:\\path\\to\\Steam\\steamapps\\common\\GAME_NAME\\something\\else\\GAME_NAME.exe',
//     InstallDate: string formatted as date,
//     KernelModeTime: string as big int (eg '17187500'),
//     Name: string,
//     ParentProcessId: string as int that is process id,
//     ProcessId: string as int that is process id,
//     SessionId: string as int as session id,
//     Status: string,
//     TerminationDate: string formatted as date,
//     UserModeTime: string as big int
// }
async function getGameProcessesSteam () {
  // It is a game when it is under Steamapps common directory and is not the UnityCrashHandler
  where = 'executablepath like "%steamapps%common%" and not name like "%UnityCrashHandler%"'
  // There are a lot more fields so you can set it to whatever else you want
  get = 'name,processid,parentprocessid,executablepath,creationdate,installdate,terminationdate,status,sessionid,usermodetime,kernelmodetime'
  
  try {
    const { stdout, stderr } = await execFile('wmic', ['process', 'where', where, 'get', get, '/format:csv']);
    if (stderr) {
      console.error(`${proctracker}[GameTracker]${err}`, stderr, `${reset}`);
      return [];
    }
    const json = await csv().fromString(stdout.trim())
    return json;
  } catch (error) {
    if (error) { 
        console.error(`${proctracker}[GameTracker]${err}`, error, `${reset}`);
        return []; 
    }
  }
}

function recordGameSessions(snapshot) {
  console.info(`${proctracker}[GameTracker]${reset} Recording game sessions...`);
  console.info(`${proctracker}[GameTracker]${reset} snapshot= `, snapshot);

  return;
  thisSnapshot = {}; // {game_id: {session_id, user_id, game_id, durationMinutes}}

  // 1

  snapshot.forEach((game) => {
    if (!(game.id in thisSnapshot)) {
      // This game just started
      let new_session = {gameId: game.id, durationMinutes: INTERVAL_SECONDS / 60};
      console.info(`${proctracker}[GameTracker]${reset} ${game.Name} has started...`);
      thisSnapshot[game.id] = new_session;
    }
  })

  return;
  thisSnapshot = {};
  latestSnapshot.forEach((game) => {
    if (game in snapshot) {
      // This game is continuing
      // ... Add INTERVAL_SECONDS to already existing games
      console.info(`${proctracker}[GameTracker]${reset} ${game.Name} is continuing...`);
      thisSnapshot.add(game);
    } else {
      // This game has stopped
      // ... Save cur_time to formerly exisiting games
      console.info(`${proctracker}[GameTracker]${reset} ${game.Name} has ended...`);
    }
  })

  snapshot.forEach((game) => {
    if (!(game in thisSnapshot)) {
      // This game just started
      // ... Set INTERVAL_SECONDS to new games
      console.info(`${proctracker}[GameTracker]${reset} ${game.Name} has started...`);
      thisSnapshot.add(game);
    }
  })

  latestSnapshot = thisSnapshot;
  snapshot = [];

  console.info(`${proctracker}[GameTracker]${reset} LatestSnapshot=`);
  latestSnapshot.forEach((g) => {
    console.log(g);
  })
}

const GameTracker = {
  startTracking: () => {
      background_pid = setInterval(() => {
        console.info(`${proctracker}[GameTracker]${reset} Running process tracking routine!`);
        // Add different methods of finding games here
        steamGames = getGameProcessesSteam();

        Promise.all([steamGames]) // Then, add the Promise inside the array
        .then((values) => {
          let snapshot = [].concat(...values)
          console.log(`${proctracker}[GameTracker]${reset} Found games:\n`, snapshot)
          
          let upserts = [];
          for (const s of snapshot) {
            // Upsert to account for newly detected games.
            upserts.push(GameRepository.upsertGame(
              s["Name"],
              s["ExecutablePath"],
              "Steam (PC)", // everything is this for now
              Genre.DECKBUILDER // everything is this for now
            ));
          }
          Promise.all(upserts).then((t) => {recordGameSessions(t);});
        });
      }, 1000 * INTERVAL_SECONDS)
  },
  stopTracking: () => {
    clearInterval(background_pid);
  }
};

module.exports = {GameTracker};

