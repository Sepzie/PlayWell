const { startTracking, stopTracking } = require('./gameTracker.js');
const { connectDb, disconnectDb } = require('./dbService.js');
const { debug_colors } = require('../src/theme/colors.js');
const csv = require('csvtojson');
const { execFile } = require('node:child_process');


function startBackground() {
  connectDb();

  console.log('Starting background process...');
  var interval_seconds = 3;
  setInterval(() => {
    console.info(`${debug_colors.info}[ProcTracker]${debug_colors.reset} Running process tracking routine!`);
    processes = getGameProcesses();
    // Processes is a JSON Array. Do stuff here:

  }, 1000 * interval_seconds)

  
  console.log('Background process started (placeholder)');
}

function stopBackground() {
  console.log('Stopping background process...');
  
  // TODO: Implement proper cleanup
  // stopTracking();
  disconnectDb();
  
  console.log('Background process stopped (placeholder)');
}

function getGameProcesses() {
  // It is a game when it is under Steamapps common directory and is not the UnityCrashHandler
  where = 'executablepath like "%steamapps%common%" and not name like "%UnityCrashHandler%"'
  // There are a lot more fields so you can set it to whatever else you want
  get = 'name,processid,parentprocessid,executablepath,creationdate,installdate,terminationdate,status,sessionid,usermodetime,kernelmodetime'
  execFile('wmic', ['process', 'where', where, 'get', get, '/format:csv'], (err, stdout, stderr) => {
    if (err) { 
      console.error(`${debug_colors.info}[ProcTracker]${debug_colors.reset} `, err);
      return; 
    }
    if (stderr) {
      console.error(`${debug_colors.info}[ProcTracker]${debug_colors.reset} `, stderr);
      return;
    }

    csv().fromString(stdout.trim())
    .then((json) => {
      console.log(`${debug_colors.info}[ProcTracker]${debug_colors.reset} Found games:\n`, json)
    })
  })
}

module.exports = { startBackground, stopBackground };

