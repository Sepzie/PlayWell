// Load environment variables first
require('dotenv').config();

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const TrayManager = require('./electron.tray.js');
const { startBackground, stopBackground } = require('./background/index.js');
const timer = require('./background/workers/timerController.js');
const { StatsService } = require('./background/services/statsService.js');
const { LimitsService } = require('./background/services/limitsService.js');
const { UserRepository } = require('./background/repository/user.js');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  console.log('isDev:', isDev, 'NODE_ENV:', process.env.NODE_ENV, 'isPackaged:', app.isPackaged);

  if (isDev) {
    // In development, load from Vite dev server
    console.log('Loading from Vite dev server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    console.log('Loading from built files');
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Handle page load events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Failed to load page:', errorCode, errorDescription, validatedURL);
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Initialize TrayManager and make the tray
  trayManager = new TrayManager('src/public/icon.png', OpenMainWindow);
  trayManager.createTray();

  // Start background process
  startBackground();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackground();
    app.quit();
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
ipcMain.on('timer-start', (ev, durationSeconds) => timer.setup(durationSeconds));
ipcMain.on('timer-pause', () => timer.pause());
ipcMain.on('timer-reset', () => timer.reset());
ipcMain.handle('timer-get-state', () => timer.getState());
ipcMain.on('timer-resume', () => timer.resume());
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

// History IPC handler
ipcMain.handle('get-history-data', async (event, options = {}) => {
  return await StatsService.getHistoryData(options);
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