const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const TrayManager = require('./electron.tray.js');
const { startBackground, stopBackground } = require('./background/index.js');
const timer = require('./background/timerController.js');
const { GamingSessionRepository } = require('./background/repository/gamingSession.js');

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

// Timer control IPC handlers
ipcMain.on('timer-start', (ev, durationSeconds) => timer.setup(durationSeconds));
ipcMain.on('timer-pause', () => timer.pause());
ipcMain.on('timer-reset', () => timer.reset());
ipcMain.handle('timer-get-state', () => timer.getState());
ipcMain.on('timer-resume', () => timer.resume());

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
  try {
    const { period = 'today', customStart, customEnd } = options;

    let startDate, endDate;
    const now = new Date();

    // Set endDate to end of current day
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    // Calculate startDate based on period
    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'week':
        startDate = new Date(now);
        // Get to start of week (Sunday)
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'custom':
        if (!customStart || !customEnd) {
          throw new Error('Custom period requires customStart and customEnd dates');
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        break;

      default:
        throw new Error(`Unknown period: ${period}`);
    }

    console.log(`[electron.main.js] Fetching stats from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get all sessions from database (including active ones, since they're now updated in real-time)
    const stats = await GamingSessionRepository.getGameStats(startDate, endDate);

    console.log(`[electron.main.js] Returning ${stats.length} games`);
    return stats;

  } catch (error) {
    console.error('[electron.main.js] Error fetching game stats:', error);
    return [];
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