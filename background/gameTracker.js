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
let activeGamingSessions = {}; // public Snapshot as an object {game_id: game_session}

// Structure of game processes from Steam
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

/**
 * Handles GameSession tracking controls.
 * A GameSession can be of 3 states: continuing, starting, or ending. 
 * 
 * @param {Array[Object]} snapshot an array of Game objects detected by the GameTracker at this current time step 
 */
function recordGameSessions(snapshot) {
  console.info(`${proctracker}[GameTracker]${reset} Recording game sessions...`);

  let promises = [];
  nextActiveGamingSessions = {}; // {game_id: {session_id, user_id, game_id, durationMinutes}}

  for (const game of snapshot) {
    if (Object.hasOwn(activeGamingSessions, game.id)) {
      // This game is continuing
      nextActiveGamingSessions[game.id] = activeGamingSessions[game.id];
      nextActiveGamingSessions[game.id].durationMinutes += INTERVAL_SECONDS / 60;
    }
    else {
      // This game just started
      let startP = GamingSessionRepository.startGamingSession(game.id, 0).then((gs) => {
        nextActiveGamingSessions[game.id] = gs;
      });
      promises.push(startP);
    }
  }

  for (const [gid, gs] of Object.entries(activeGamingSessions)) {
    if (!Object.hasOwn(nextActiveGamingSessions, gid)) {
      // This game has ended
      let endP = GamingSessionRepository.endGamingSession(gs.id, gs.durationMinutes);
      promises.push(endP);
    }
  }

  Promise.all(promises).then(() => {
    activeGamingSessions = nextActiveGamingSessions;
    console.info(`${proctracker}[GameTracker]${reset} Active Gaming Sessions =`, activeGamingSessions);
  });
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
          // console.log(`${proctracker}[GameTracker]${reset} Found games:\n`, snapshot)
          
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
    recordGameSessions([]); // end all GamingSessions when stopping tracking
  },
  /**
   * Returns a read-only copy of activeGamingSessions.
   * This addresses the need to reference active Gaming Sessions that GameTracker manages, as the records in
   * the database won't update until a GameSession has ended.
   * 
   * @returns a JSON object where the key is the Game id and the value is a GamingSession object
   */
  getActiveGamingSessions: () => {
    return JSON.parse(JSON.stringify(activeGamingSessions));
  }
};

module.exports = {GameTracker};

