// Load environment variables first (optional in production)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available in production build, which is fine
}

const { app, BrowserWindow, ipcMain, dialog, protocol, net, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Setup file logging for debugging
const logFile = path.join(app.getPath('userData'), 'debug.log');
function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

// Override console methods to also write to file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = (...args) => {
  originalConsoleLog(...args);
  logToFile('LOG: ' + args.join(' '));
};
console.error = (...args) => {
  originalConsoleError(...args);
  logToFile('ERROR: ' + args.join(' '));
};

logToFile('=== App Starting ===');
const TrayManager = require('./electron.tray.js');
const { startBackground, stopBackground } = require('./background/index.js');
const timer = require('./background/workers/timerController.js');
const { StatsService } = require('./background/services/statsService.js');
const { LimitsService } = require('./background/services/limitsService.js');
const { UserRepository } = require('./background/repository/user.js');
const { GameRepository } = require('./background/repository/game.js');
const { NotificationPreferencesRepository } = require('./background/repository/notificationPreferences.js');

// Keep a global reference of the window object
let mainWindow;
let trayManager;

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (!isDev) {
    try {
      await stopBackground();
    } catch (e) {
      console.error('Error stopping background processes:', e);
    }
    dialog.showErrorBoxSync('Application Error', `An unexpected error occurred: ${error.message}`);
    app.quit();
    process.exit(1);
  }
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (!isDev) {
    try {
      await stopBackground();
    } catch (e) {
      console.error('Error stopping background processes:', e);
    }
    dialog.showErrorBoxSync('Application Error', `An unexpected error occurred: ${reason}`);
    app.quit();
    process.exit(1);
  }
});

// Initialize database for packaged app
function initializeDatabase() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (!isDev) {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'main.db');
    
    // If database doesn't exist in userData, copy from resources
    if (!fs.existsSync(dbPath)) {
      const sourceDbPath = path.join(__dirname, 'prisma', 'main.db');
      console.log('Copying database from', sourceDbPath, 'to', dbPath);
      
      try {
        fs.copyFileSync(sourceDbPath, dbPath);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    } else {
      console.log('Database already exists at', dbPath);
    }
  }
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Required for ES modules to load from file:// protocol in ASAR
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Hide the application menu bar
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Load the app
  console.log('isDev:', isDev, 'NODE_ENV:', process.env.NODE_ENV, 'isPackaged:', app.isPackaged);

  if (isDev) {
    // In development, load from Vite dev server
    console.log('Loading from Vite dev server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html directly
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('Loading from built files:', indexPath);

    mainWindow.loadFile(indexPath);
  }

  if (isDev) {
    // Handle page load events (dev only)
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page finished loading');
      console.log('Current URL:', mainWindow.webContents.getURL());
    });

    // Log all console messages from the renderer (dev only)
    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      const levelText = ['LOG', 'WARNING', 'ERROR'][level] || 'INFO';
      const logMsg = `[Renderer ${levelText}] ${message} (${sourceId}:${line})`;
      console.log(logMsg);
      logToFile(logMsg);
    });

    // Log when scripts start and finish loading (dev only)
    mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      if (details.url.includes('.js') || details.url.includes('.css')) {
        console.log('[Loading]', details.url);
        logToFile(`[Loading] ${details.url}`);
      }
      callback({});
    });

    mainWindow.webContents.session.webRequest.onCompleted((details) => {
      if (details.url.includes('.js') || details.url.includes('.css')) {
        console.log('[Loaded]', details.statusCode, details.url);
        logToFile(`[Loaded] ${details.statusCode} ${details.url}`);
      }
    });
  }

  mainWindow.webContents.on('did-fail-load', async (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load page:', errorCode, errorDescription, validatedURL);

    // If we fail to load in production, show error and quit
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (!isDev && errorCode !== -3) { // -3 is ERR_ABORTED, which is normal for redirects
      try {
        await stopBackground();
      } catch (e) {
        console.error('Error stopping background processes:', e);
      }
      dialog.showErrorBoxSync('Load Error', `Failed to load application: ${errorDescription}`);
      app.quit();
      process.exit(1);
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  try{
    // Initialize database for production
    initializeDatabase();

    createWindow();

    // Initialize TrayManager and make the tray
    const iconPath = path.join(app.getAppPath(), 'src', 'public', 'icon.png');
    trayManager = new TrayManager(iconPath, OpenMainWindow);
    trayManager.createTray();

    // Start background process
    startBackground();
  } catch (error) {
    console.error('Fatal error during app initialization:', error);

    // Stop background processes before quitting
    await stopBackground().catch(e => {
      console.error('Error stopping background processes:', e);
    });

    dialog.showErrorBoxSync('Initialization Error', `Failed to start PlayWell: ${error.message}`);
    app.quit();
    process.exit(1);
  }

  // Listen for currently playing game changes and update tray
  const { gameTracker } = require('./background/index.js');
  gameTracker.on('currently-playing-changed', (game) => {
    if (trayManager) {
      trayManager.setCurrentlyPlayingGame(game ? game.gameName : null);
    }
    
    // Also broadcast to tray window
    if (trayManager && trayManager.trayWindow) {
      try {
        trayManager.trayWindow.webContents.send('currently-playing-changed', game ? game.gameName : null);
      } catch (e) {
        // Tray window might not be ready yet
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('quit', () => {
  if (process.platform !== 'darwin') {
    stopBackground();
    // app.quit();
  }
});

// Placeholder IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

// Broadcast timer updates from controller to all renderer windows
timer.on('update', (state) => {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(w => {
    try { w.webContents.send('timer-update', state); } catch (e) { }
  });
});

// Handle over-limit state changes - show tray popup
timer.on('over-limit-changed', ({ isOverLimit }) => {
  if (isOverLimit && trayManager && trayManager.trayWindow) {
    try {
      console.log('[Main] User went over limit - showing tray popup');
      // Position and show the tray window
      const tray = trayManager.tray;
      const bounds = tray.getBounds();
      const x = Math.round(bounds.x + (bounds.width / 2) - (trayManager.trayWindow.getSize()[0] / 2));
      const y = Math.round(bounds.y - trayManager.trayWindow.getSize()[1]);
      trayManager.trayWindow.setPosition(x, y);
      trayManager.trayWindow.show();
      trayManager.trayWindow.focus();
    } catch (e) {
      console.error('[Main] Error showing tray on over-limit:', e);
    }
  }
});

// Timer control IPC handlers
ipcMain.handle('timer-get-state', () => timer.getState());
ipcMain.on('timer-force-update', () => timer.forceUpdate());

// Open/focus main window and navigate to a limits page upon request from tray menu
ipcMain.on('open-limits', () => {
  try {
    OpenMainWindow();

    const sendNavigate = () => {
      try {
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('navigate', '/limits');
        }
      } catch (err) {
        console.error('Failed to send navigate message:', err);
      }
    };

    // If the window is still loading, wait for it to finish first
    if (mainWindow && mainWindow.webContents && mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', sendNavigate);
    } else {
      sendNavigate();
    }
  } catch (err) {
    console.error('Error handling open-limits:', err);
  }
});

// Handler to open/focus the main window on demand
ipcMain.on('open-main-window', () => {
  OpenMainWindow();
});

// Stats IPC handler
ipcMain.handle('get-game-stats', async (event, options = {}) => {
  return await StatsService.getGameStats(options);
});

// History IPC handlers
ipcMain.handle('get-history-data', async (event, options = {}) => {
  return await StatsService.getHistoryData(options);
});
ipcMain.handle('get-oldest-and-newest-session-dates', async () => {
  return await StatsService.getOldestAndNewestSessionDates();
});

// Limits IPC handlers
ipcMain.handle('get-limits', async () => {
  const user = UserRepository.getCurrentUser();
  if (!user) {
    console.error('[IPC] No user loaded for get-limits');
    return [];
  }
  return await LimitsService.getUserLimits(user.id);
});

ipcMain.handle('set-limit', async (event, { type, limitMinutes }) => {
  const user = UserRepository.getCurrentUser();
  if (!user) {
    console.error('[IPC] No user loaded for set-limit');
    return {};
  }
  return await LimitsService.setLimit(user.id, type, limitMinutes);
});

ipcMain.handle('delete-limit', async (event, { type }) => {
  const user = UserRepository.getCurrentUser();
  if (!user) {
    console.error('[IPC] No user loaded for delete-limit');
    return {};
  }
  return await LimitsService.deleteLimit(user.id, type);
});

ipcMain.handle('get-limit-status', async () => {
  const user = UserRepository.getCurrentUser();
  if (!user) {
    console.error('[IPC] No user loaded for get-limit-status');
    return {
      hasLimit: false,
      limitMinutes: 0,
      playedMinutes: 0,
      remainingMinutes: 0,
      isOverLimit: false,
      dayOfWeek: 'UNKNOWN'
    };
  }
  return await LimitsService.getLimitStatus(user.id);
});

// Exit handler (via "Exit App" button on Settings page)
ipcMain.on('quit-app', () => {app.quit();})

// Game management IPC handlers
ipcMain.handle('get-all-games', async () => {
  try {
    return await GameRepository.getAllGames();
  } catch (error) {
    console.error('[IPC] Error getting all games:', error);
    return [];
  }
});

ipcMain.handle('enable-game', async (event, { gameId }) => {
  try {
    return await GameRepository.enableGame(gameId);
  } catch (error) {
    console.error('[IPC] Error enabling game:', error);
    return {};
  }
});

ipcMain.handle('disable-game', async (event, { gameId }) => {
  try {
    return await GameRepository.disableGame(gameId);
  } catch (error) {
    console.error('[IPC] Error disabling game:', error);
    return {};
  }
});

ipcMain.handle('delete-game', async (event, { gameId }) => {
  try {
    const { gameTracker } = require('./background/index.js');
    const result = await GameRepository.deleteGame(gameId);
    // Refresh game cache after deletion
    await gameTracker.refreshGameCache();
    return result;
  } catch (error) {
    console.error('[IPC] Error deleting game:', error);
    return {};
  }
});

ipcMain.handle('add-manual-game', async (event, { name, location }) => {
  try {
    const { gameTracker } = require('./background/index.js');
    const game = await GameRepository.createGame(name, location, 'Manual');
    // Refresh game cache after addition
    await gameTracker.refreshGameCache();
    return game;
  } catch (error) {
    console.error('[IPC] Error adding manual game:', error);
    return {};
  }
});

// File picker dialog for selecting game executable
ipcMain.handle('select-game-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Game Executable',
      filters: [
        { name: 'Executables', extensions: ['exe'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled) {
      return { canceled: true };
    }
    
    return { 
      canceled: false, 
      filePath: result.filePaths[0] 
    };
  } catch (error) {
    console.error('[IPC] Error selecting game file:', error);
    return { canceled: true, error: error.message };
  }
});

// Notification preferences IPC handlers
ipcMain.handle('get-notification-preferences', async () => {
  try {
    const user = UserRepository.getCurrentUser();
    if (!user) {
      console.error('[IPC] No user loaded for get-notification-preferences');
      return { newGameDetected: true, gameStarted: true, gameStopped: true, stopTrackingOnUnfocus: false };
    }
    return await NotificationPreferencesRepository.getPreferences(user.id);
  } catch (error) {
    console.error('[IPC] Error getting notification preferences:', error);
    return { newGameDetected: true, gameStarted: true, gameStopped: true, stopTrackingOnUnfocus: false };
  }
});

ipcMain.handle('update-notification-preferences', async (event, prefs) => {
  try {
    const user = UserRepository.getCurrentUser();
    if (!user) {
      console.error('[IPC] No user loaded for update-notification-preferences');
      return {};
    }
    return await NotificationPreferencesRepository.updatePreferences(user.id, prefs);
  } catch (error) {
    console.error('[IPC] Error updating notification preferences:', error);
    return {};
  }
});

function OpenMainWindow() {
  if (!mainWindow) {
    createWindow();
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

// TODO: Add auto-start at login functionality
// app.setLoginItemSettings({
//   openAtLogin: true,
//   openAsHidden: true
// });
