const csv = require('csvtojson');
const BackgroundService = require('./BackgroundService.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { proctracker, reset, err } = debug_colors;
const util = require('node:util');
const execFile = util.promisify(require('node:child_process').execFile);
const { GameRepository } = require('../repository/game.js');
const { GamingSessionRepository } = require('../repository/gamingSession.js');
const { FocusTracker } = require('./focusTracker.js');
const { NotificationPreferencesRepository } = require('../repository/notificationPreferences.js');
const { UserRepository } = require('../repository/user.js');

const INTERVAL_SECONDS = 3;
const UNFOCUS_TIMEOUT_MS = 30000; // 30 seconds

// Platform patterns for game detection
const PLATFORM_PATTERNS = [
  {
    platform: 'Steam (PC)',
    pathSegments: ['steamapps\\common\\'],
    launcherExeNames: ['Steam.exe'],
  },
  {
    platform: 'Epic Games',
    pathSegments: ['Epic Games\\'],
    launcherExeNames: ['EpicGamesLauncher.exe'],
  },
  {
    platform: 'GOG Galaxy',
    pathSegments: ['GOG Galaxy\\Games\\', 'GOG Games\\'],
    launcherExeNames: ['GalaxyClient.exe'],
  },
  {
    platform: 'Battle.net',
    pathSegments: ['World of Warcraft\\', 'Battle.net\\'],
    launcherExeNames: ['Battle.net.exe'],
  },
  {
    platform: 'EA app',
    pathSegments: ['EA Games\\', 'Electronic Arts\\EA Desktop\\EA Desktop\\'],
    launcherExeNames: ['EADesktop.exe'],
  },
  {
    platform: 'Origin',
    pathSegments: ['Origin Games\\'],
    launcherExeNames: ['Origin.exe'],
  },
  {
    platform: 'Ubisoft Connect',
    pathSegments: ['Ubisoft\\Ubisoft Game Launcher\\'],
    launcherExeNames: ['UbisoftConnect.exe'],
  },
  {
    platform: 'Riot',
    pathSegments: ['Riot Games\\'],
    launcherExeNames: ['RiotClientServices.exe'],
  },
  {
    platform: 'Rockstar',
    pathSegments: ['Rockstar Games\\'],
    launcherExeNames: ['Launcher.exe', 'RockstarService.exe'],
  },
];

/**
 * Gets all game processes by scanning for known platform patterns.
 * Returns processes with window titles for better game name detection.
 *
 * @returns {Promise<Array>} Array of process objects with Name, ProcessId, ExecutablePath, MainWindowTitle
 */
async function getGameProcessesByPlatform() {
  try {
    // Use PowerShell to get all processes with paths and window titles in one go
    const psCommand = `
      Get-Process | Where-Object {
        $_.Path -ne $null -and $_.MainWindowHandle -ne 0
      } | Select-Object Name, Id, Path, MainWindowTitle | ConvertTo-Json
    `;

    const { stdout, stderr } = await execFile('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      psCommand
    ]);

    if (stderr && stderr.trim()) {
      console.error(`${proctracker}[GameTracker]${err}`, stderr, `${reset}`);
      return [];
    }

    if (!stdout || !stdout.trim()) {
      return [];
    }

    let processes;
    try {
      const parsed = JSON.parse(stdout.trim());
      // PowerShell returns a single object if only one result, wrap it in array
      processes = Array.isArray(parsed) ? parsed : [parsed];
    } catch (parseError) {
      console.error(`${proctracker}[GameTracker]${err} Failed to parse process list${reset}`);
      return [];
    }

    // Filter processes based on platform patterns
    const gameProcesses = processes.filter(proc => {
      const path = proc.Path || '';
      const name = proc.Name || '';
      
      // Check if path matches any platform pattern
      const matchesPlatform = PLATFORM_PATTERNS.some(pattern => 
        pattern.pathSegments.some(seg => path.includes(seg))
      );

      if (!matchesPlatform) return false;

      // Exclude launcher executables
      const isLauncher = PLATFORM_PATTERNS.some(pattern =>
        pattern.launcherExeNames.some(launcherName => 
          name.toLowerCase().includes(launcherName.toLowerCase().replace('.exe', ''))
        )
      );

      if (isLauncher) return false;

      // Exclude common non-game processes
      const commonExclusions = ['unityCrashHandler', 'crashreporter', 'launcher'];
      const isExcluded = commonExclusions.some(excl => 
        name.toLowerCase().includes(excl.toLowerCase())
      );

      return !isExcluded;
    });

    // Map to expected format
    const result = gameProcesses.map(proc => ({
      Name: proc.Name,
      ProcessId: proc.Id.toString(),
      ExecutablePath: proc.Path,
      MainWindowTitle: proc.MainWindowTitle || proc.Name.replace('.exe', '')
    }));

    return result.filter(p => p.MainWindowTitle && p.MainWindowTitle.trim());
  } catch (error) {
    console.error(`${proctracker}[GameTracker]${err}`, error, `${reset}`);
    return [];
  }
}

/**
 * Gets the window title for a specific process ID.
 *
 * @param {string|number} processId - The process ID
 * @returns {Promise<string|null>} Window title or null
 */
async function getWindowTitle(processId) {
  try {
    const psCommand = `
      Get-Process -Id ${processId} -ErrorAction SilentlyContinue | 
        Where-Object {$_.MainWindowHandle -ne 0} | 
        Select-Object -ExpandProperty MainWindowTitle
    `;

    const { stdout } = await execFile('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      psCommand
    ]);

    return stdout ? stdout.trim() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Determines the platform for a given executable path.
 *
 * @param {string} executablePath - The full path to the executable
 * @returns {string} The detected platform name or 'Unknown'
 */
function detectPlatform(executablePath) {
  for (const pattern of PLATFORM_PATTERNS) {
    for (const segment of pattern.pathSegments) {
      if (executablePath.includes(segment)) {
        return pattern.platform;
      }
    }
  }
  return 'Unknown';
}

/**
 * GameTracker extends BackgroundService to track active gaming sessions.
 * It periodically scans for running game processes and manages session state.
 * Now integrates with FocusTracker for accurate focus-based tracking.
 *
 * Emits:
 * - 'gaming-state-changed' with {isGaming: boolean}
 * - 'new-game-detected' with {gameId, gameName, platform}
 * - 'game-started' with {gameId, gameName}
 * - 'game-stopped' with {gameId, gameName, durationSeconds}
 * - 'currently-playing-changed' with {gameName, gameId} or null
 */
class GameTracker extends BackgroundService {
  constructor() {
    super('GameTracker');
    this.activeGamingSessions = {}; // {game_id: {id, gameId, userId, durationSeconds, gameName}}
    this.wasGaming = false;
    this.knownGames = new Map(); // Cache: location -> game object
    this.focusTracker = new FocusTracker();
    this.currentlyFocusedGameId = null; // Track which game is currently focused
    this.focusTimestamps = {}; // {game_id: lastFocusTime}
    this.currentlyPlayingGame = null; // {gameName, gameId} for tray display
  }

  /**
   * Refreshes the known games cache from the database.
   */
  async refreshKnownGames() {
    try {
      const games = await GameRepository.getAllGames();
      this.knownGames.clear();
      for (const game of games) {
        this.knownGames.set(game.location, game);
      }
    } catch (error) {
      console.error(`${proctracker}[GameTracker]${err} Error refreshing known games:${reset}`, error);
    }
  }

  /**
   * Detects games from running processes and matches them against known games.
   * Auto-adds new games to the database.
   *
   * @returns {Promise<Array>} Array of detected game objects from DB
   */
  async detectGames() {
    const processes = await getGameProcessesByPlatform();
    const detectedGames = [];
    const newGames = [];

    for (const proc of processes) {
      const execPath = proc.ExecutablePath;
      const windowTitle = proc.MainWindowTitle;
      
      // Check if we already know this game
      let game = this.knownGames.get(execPath);

      if (!game) {
        // New game detected - add to database
        const platform = detectPlatform(execPath);
        const gameName = windowTitle || proc.Name.replace('.exe', '');

        try {
          game = await GameRepository.upsertGame(gameName, execPath, platform);
          this.knownGames.set(execPath, game);
          newGames.push(game);
          this._log('info', `New game detected: ${gameName} (${platform})`);
        } catch (error) {
          console.error(`${proctracker}[GameTracker]${err} Error adding new game:${reset}`, error);
          continue;
        }
      }

      if (game) {
        detectedGames.push({
          ...game,
          processId: parseInt(proc.ProcessId),
          windowTitle: windowTitle
        });
      }
    }

    // Emit events for new games
    for (const game of newGames) {
      this.emit('new-game-detected', {
        gameId: game.id,
        gameName: game.name,
        platform: game.platform
      });
    }

    return detectedGames;
  }

  /**
   * Tracks active gaming sessions for enabled games that are currently focused.
   *
   * @param {Array} detectedGames - Array of detected game objects with processId
   */
  async trackActiveSessions(detectedGames) {
    const enabledGames = detectedGames.filter(g => g.enabled !== false);
    
    // Register all enabled games with focus tracker
    this.focusTracker.clearGameProcesses();
    for (const game of enabledGames) {
      this.focusTracker.registerGameProcess(
        game.processId,
        game.id,
        game.windowTitle || game.name,
        game.location
      );
    }

    // Determine which game is currently focused
    const currentFocus = this.focusTracker.getCurrentFocus();
    let focusedGameId = null;

    if (currentFocus) {
      const focusedGame = enabledGames.find(g => g.processId === currentFocus.processId);
      if (focusedGame) {
        focusedGameId = focusedGame.id;
        this.focusTimestamps[focusedGameId] = Date.now();
      }
    }

    // Handle session state changes
    const promises = [];
    const nextActiveGamingSessions = {};

    // Process the currently focused game
    if (focusedGameId) {
      const game = enabledGames.find(g => g.id === focusedGameId);
      
      if (Object.hasOwn(this.activeGamingSessions, focusedGameId)) {
        // Continuing session - update duration
        nextActiveGamingSessions[focusedGameId] = this.activeGamingSessions[focusedGameId];
        nextActiveGamingSessions[focusedGameId].durationSeconds += INTERVAL_SECONDS;

        const updateP = GamingSessionRepository.updateGamingSession(
          nextActiveGamingSessions[focusedGameId].id,
          nextActiveGamingSessions[focusedGameId].durationSeconds
        );
        promises.push(updateP);
      } else {
        // New session starting
        const startP = GamingSessionRepository.startGamingSession(game.id, 0).then((gs) => {
          nextActiveGamingSessions[focusedGameId] = {
            ...gs,
            gameName: game.windowTitle || game.name
          };
          this.emit('game-started', {
            gameId: game.id,
            gameName: game.windowTitle || game.name
          });
        });
        promises.push(startP);
      }

      // Update currently playing for tray
      const gameName = game.windowTitle || game.name;
      if (!this.currentlyPlayingGame || this.currentlyPlayingGame.gameId !== focusedGameId) {
        this.currentlyPlayingGame = { gameName, gameId: focusedGameId };
        this.emit('currently-playing-changed', this.currentlyPlayingGame);
      }
    } else {
      // No game is focused
      if (this.currentlyPlayingGame) {
        this.currentlyPlayingGame = null;
        this.emit('currently-playing-changed', null);
      }
    }

    // End sessions that lost focus for more than 30 seconds (if enabled)
    // Check user preference for stopping on unfocus
    const user = UserRepository.getCurrentUser();
    let stopOnUnfocus = true; // default behavior
    if (user) {
      try {
        const prefs = await NotificationPreferencesRepository.getPreferences(user.id);
        stopOnUnfocus = prefs.stopTrackingOnUnfocus !== false;
      } catch (error) {
        // Use default if can't load preferences
      }
    }

    const now = Date.now();
    for (const [gid, gs] of Object.entries(this.activeGamingSessions)) {
      const shouldContinue = Object.hasOwn(nextActiveGamingSessions, gid);
      
      if (!shouldContinue) {
        const lastFocusTime = this.focusTimestamps[gid] || 0;
        const timeSinceLastFocus = now - lastFocusTime;
        const gameIsClosed = !enabledGames.find(g => g.id === gid);

        // End session if: game is closed OR (unfocus tracking is enabled AND unfocused for 30+ seconds)
        const shouldEndSession = gameIsClosed || (stopOnUnfocus && timeSinceLastFocus > UNFOCUS_TIMEOUT_MS);

        if (shouldEndSession) {
          const endP = GamingSessionRepository.endGamingSession(gs.id, gs.durationSeconds).then(() => {
            this.emit('game-stopped', {
              gameId: gid,
              gameName: gs.gameName,
              durationSeconds: gs.durationSeconds
            });
          });
          promises.push(endP);
          delete this.focusTimestamps[gid];
        } else {
          // Keep session alive but don't increment duration if not focused
          nextActiveGamingSessions[gid] = gs;
        }
      }
    }

    await Promise.all(promises);
    this.activeGamingSessions = nextActiveGamingSessions;

    // Update gaming state
    const isGaming = Object.keys(this.activeGamingSessions).length > 0;
    if (isGaming !== this.wasGaming) {
      this.wasGaming = isGaming;
      this.emit('gaming-state-changed', { isGaming });
    }
  }

  /**
   * Called on each interval tick to scan for game processes.
   */
  async _onIntervalTick() {
    try {
      const detectedGames = await this.detectGames();
      await this.trackActiveSessions(detectedGames);
    } catch (error) {
      console.error(`${proctracker}[GameTracker]${err} Error in interval tick:${reset}`, error);
    }
  }

  /**
   * Starts the game tracking service.
   */
  async startTracking() {
    this.start();
    await this.refreshKnownGames();
    this.focusTracker.startTracking();
    
    // Listen to focus changes
    this.focusTracker.on('game-focused', (gameInfo) => {
      this.currentlyFocusedGameId = gameInfo.gameId;
      this.focusTimestamps[gameInfo.gameId] = Date.now();
    });

    this.focusTracker.on('game-unfocused', (gameInfo) => {
      if (this.currentlyFocusedGameId === gameInfo.gameId) {
        this.currentlyFocusedGameId = null;
      }
    });

    this._startInterval(1000 * INTERVAL_SECONDS);
    this._log('info', 'Game tracking started');
  }

  /**
   * Stops the game tracking service.
   */
  stopTracking() {
    this.stop();
    this.focusTracker.stopTracking();
    
    // End all active sessions
    const promises = [];
    for (const [gid, gs] of Object.entries(this.activeGamingSessions)) {
      promises.push(GamingSessionRepository.endGamingSession(gs.id, gs.durationSeconds));
    }
    Promise.all(promises).then(() => {
      this.activeGamingSessions = {};
      this._log('info', 'Game tracking stopped');
    });
  }

  /**
   * Returns a read-only copy of activeGamingSessions.
   *
   * @returns {Object} Active gaming sessions
   */
  getActiveGamingSessions() {
    return JSON.parse(JSON.stringify(this.activeGamingSessions));
  }

  /**
   * Gets the currently playing game for tray display.
   *
   * @returns {Object|null} {gameName, gameId} or null if no game is playing
   */
  getCurrentlyPlayingGame() {
    return this.currentlyPlayingGame;
  }

  /**
   * Manually refresh the known games cache.
   * Call this after adding/removing games from settings.
   */
  async refreshGameCache() {
    await this.refreshKnownGames();
  }
}

module.exports = { GameTracker };
