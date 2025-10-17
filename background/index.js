const { startTracking, stopTracking } = require('./gameTracker.js');
const { connectDb, disconnectDb } = require('./dbService.js');
const { UserRepository } = require('./repository/user.js');
const { debug_colors } = require('../src/theme/colors.js');
const { server, proctracker, reset, err } = debug_colors;
const csv = require('csvtojson');
const { execFile } = require('node:child_process');

let background_pid;

async function startBackground() {
  connectDb();

  console.info(`${server}[index.js]${reset} Starting background process...`);
  var interval_seconds = 3;
  background_pid = setInterval(() => {
    console.info(`${proctracker}[ProcTracker]${reset} Running process tracking routine!`);
    processes = getGameProcesses();
    // Processes is a JSON Array. Do stuff here:

  }, 1000 * interval_seconds)

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
  
  clearInterval(background_pid);
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

function getGameProcesses() {
  // It is a game when it is under Steamapps common directory and is not the UnityCrashHandler
  where = 'executablepath like "%steamapps%common%" and not name like "%UnityCrashHandler%"'
  // There are a lot more fields so you can set it to whatever else you want
  get = 'name,processid,parentprocessid,executablepath,creationdate,installdate,terminationdate,status,sessionid,usermodetime,kernelmodetime'
  execFile('wmic', ['process', 'where', where, 'get', get, '/format:csv'], (err, stdout, stderr) => {
    if (err) { 
      console.error(`${proctracker}[ProcTracker]${reset} `, err);
      return; 
    }
    if (stderr) {
      console.error(`${proctracker}[ProcTracker]${reset} `, stderr);
      return;
    }

    csv().fromString(stdout.trim())
    .then((json) => {
      console.log(`${proctracker}[ProcTracker]${reset} Found games:\n`, json)
    })
  })
}

module.exports = { startBackground, stopBackground };

