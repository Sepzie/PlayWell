const csv = require('csvtojson');
const { debug_colors } = require('../src/theme/colors.js');
const { proctracker, reset, err } = debug_colors;
const util = require('node:util');
const execFile = util.promisify(require('node:child_process').execFile);
const { GameRepository } = require('./repository/game.js');
const { Genre } = require('@prisma/client');

const INTERVAL_SECONDS = 3;
let background_pid;
let snapshot= []; // found games for current time slice

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

function recordGameSessions() {
  console.info(`${proctracker}[GameTracker]${reset} Recording game sessions...`);
  // Add INTERVAL_SECONDS to already existing games
  // Set to INTERVAL_SECONDS to newly existing games
  // Save cur_time to formerly exisiting games
  // See FigJam for the diagram...
}

const GameTracker = {
  startTracking: () => {
      background_pid = setInterval(() => {
        console.info(`${proctracker}[GameTracker]${reset} Running process tracking routine!`);
        // Add different methods of finding games here
        steamGames = getGameProcessesSteam();

        Promise.all([steamGames]) // Then, add the Promise inside the array
        .then((values) => {
          snapshot = [].concat(...values)
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
          Promise.all(upserts).then(() => {recordGameSessions();});
        });
      }, 1000 * INTERVAL_SECONDS)
  },
  stopTracking: () => {
    clearInterval(background_pid);
  }
};

function isGameRunning() {
  // TODO: Implement game detection logic
  return false;
}

function getCurrentGame() {
  // TODO: Implement current game detection
  return null;
}

module.exports = {GameTracker};

