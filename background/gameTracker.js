const csv = require('csvtojson');
// const { execFile } = require('node:child_process');
const { debug_colors } = require('../src/theme/colors.js');
const { proctracker, reset, err } = debug_colors;
const util = require('node:util');
const execFile = util.promisify(require('node:child_process').execFile);

async function getGameProcessesSteam () {
  // It is a game when it is under Steamapps common directory and is not the UnityCrashHandler
  where = 'executablepath like "%steamapps%common%" and not name like "%UnityCrashHandler%"'
  // There are a lot more fields so you can set it to whatever else you want
  get = 'name,processid,parentprocessid,executablepath,creationdate,installdate,terminationdate,status,sessionid,usermodetime,kernelmodetime'
  
  try {
    const { stdout, stderr } = await execFile('wmic', ['process', 'where', where, 'get', get, '/format:csv']);
    if (stderr) {
      console.error(`${proctracker}[GameTracker]${err}`, stderr, `${reset}`);
      return {};
    }
    const json = await csv().fromString(stdout.trim())
    return json;
  } catch (error) {
    if (error) { 
        console.error(`${proctracker}[GameTracker]${err}`, error, `${reset}`);
        return {}; 
    }
  }
}

let background_pid;

const GameTracker = {
  startTracking: () => {
      var interval_seconds = 3;
      background_pid = setInterval(() => {
        console.info(`${proctracker}[GameTracker]${reset} Running process tracking routine!`);
        getGameProcessesSteam()
        .then((games) => {
          console.log(`${proctracker}[GameTracker]${reset} Found games:\n`, games)
          // Processes is a JSON Array. Do stuff here:
        });
      }, 1000 * interval_seconds)
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

