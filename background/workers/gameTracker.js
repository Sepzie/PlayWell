const csv = require('csvtojson');
const BackgroundService = require('./BackgroundService.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { proctracker, reset, err } = debug_colors;
const util = require('node:util');
const execFile = util.promisify(require('node:child_process').execFile);
const { GameRepository } = require('../repository/game.js');
const { GamingSessionRepository } = require('../repository/gamingSession.js');
const { Genre } = require('@prisma/client');

const INTERVAL_SECONDS = 3;

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
    // WMIC writes "No Instance(s) Available." to stderr when no processes match - this is not an error
    if (stderr && !stderr.includes('No Instance(s) Available')) {
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
 * GameTracker extends BackgroundService to track active gaming sessions.
 * It periodically scans for running game processes and manages session state.
 *
 * Emits 'gaming-state-changed' event with {isGaming: boolean} when gaming state changes.
 */
class GameTracker extends BackgroundService {
  constructor() {
    super('GameTracker');
    this.activeGamingSessions = {}; // {game_id: game_session}
    this.wasGaming = false; // Track previous state to detect changes
    this.lastLogTime = 0;
  }

  /**
   * Handles GameSession tracking controls.
   * A GameSession can be of 3 states: continuing, starting, or ending.
   * Now updates the database on every interval tick for active sessions.
   *
   * @param {Array[Object]} snapshot an array of Game objects detected by the GameTracker at this current time step
   */
  recordGameSessions(snapshot) {
    let promises = [];
    const nextActiveGamingSessions = {}; // {game_id: {session_id, user_id, game_id, durationSeconds}}

    for (const game of snapshot) {
      if (Object.hasOwn(this.activeGamingSessions, game.id)) {
        // This game is continuing - update duration and write to DB
        nextActiveGamingSessions[game.id] = this.activeGamingSessions[game.id];
        nextActiveGamingSessions[game.id].durationSeconds += INTERVAL_SECONDS;

        // Update DB with current duration
        let updateP = GamingSessionRepository.updateGamingSession(
          nextActiveGamingSessions[game.id].id,
          nextActiveGamingSessions[game.id].durationSeconds
        );
        promises.push(updateP);
      } else {
        // This game just started - create DB record
        let startP = GamingSessionRepository.startGamingSession(game.id, 0).then((gs) => {
          nextActiveGamingSessions[game.id] = gs;
        });
        promises.push(startP);
      }
    }

    for (const [gid, gs] of Object.entries(this.activeGamingSessions)) {
      if (!Object.hasOwn(nextActiveGamingSessions, gid)) {
        // This game has ended - final DB update
        let endP = GamingSessionRepository.endGamingSession(gs.id, gs.durationSeconds);
        promises.push(endP);
      }
    }

    Promise.all(promises).then(() => {
      this.activeGamingSessions = nextActiveGamingSessions;
    });
  }

  /**
   * Called on each interval tick to scan for game processes.
   */
  _onIntervalTick() {
    // Add different methods of finding games here
    const steamGames = getGameProcessesSteam();

    Promise.all([steamGames]) // Then, add the Promise inside the array
      .then((values) => {
        let snapshot = [].concat(...values);
        let upserts = [];
        const path = require('node:path');
        for (const s of snapshot) {
          // Remove .exe from game name.
          let gameName = path.basename(s['Name'], path.extname(s['Name']))

          // Upsert to account for newly detected games.
          upserts.push(
            GameRepository.upsertGame(
              gameName,
              s['ExecutablePath'],
              'Steam (PC)', // everything is this for now
              Genre.DECKBUILDER // everything is this for now
            )
          );
        }
        Promise.all(upserts).then((t) => {
          this.recordGameSessions(t);

          // Check if gaming state changed and emit event
          const isGaming = snapshot && snapshot.length > 0;
          if (isGaming !== this.wasGaming) {
            this.wasGaming = isGaming;
            this.emit('gaming-state-changed', { isGaming });
            this._log('info', `Gaming ${isGaming ? 'started' : 'stopped'}${isGaming ? ` (${snapshot.length} game${snapshot.length !== 1 ? 's' : ''})` : ''}`);
          }
        });
      });
  }

  /**
   * Starts the game tracking service.
   */
  startTracking() {
    this.start();
    this._startInterval(1000 * INTERVAL_SECONDS);
  }

  /**
   * Stops the game tracking service.
   */
  stopTracking() {
    this.stop();
    this.recordGameSessions([]); // end all GamingSessions when stopping tracking
  }

  /**
   * Returns a read-only copy of activeGamingSessions.
   * This addresses the need to reference active Gaming Sessions that GameTracker manages, as the records in
   * the database won't update until a GameSession has ended.
   *
   * @returns a JSON object where the key is the Game id and the value is a GamingSession object
   */
  getActiveGamingSessions() {
    return JSON.parse(JSON.stringify(this.activeGamingSessions));
  }
}

module.exports = { GameTracker };

