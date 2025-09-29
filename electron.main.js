const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startBackground } = require('./background/index.js');

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
    app.quit();
  }
});

// Placeholder IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

// TODO: Add auto-start at login functionality
// app.setLoginItemSettings({
//   openAtLogin: true,
//   openAsHidden: true
// });


