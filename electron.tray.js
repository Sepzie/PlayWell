const { Tray, Menu, nativeImage, BrowserWindow, app } = require('electron');
const path = require('path');
const isDev = !!process.env.VITE_DEV_SERVER_URL;

class TrayManager {
  constructor(iconPath, openMainCallback) {
    this.iconPath = iconPath;
    this.tray = null;
    this.trayWindow = null;
    this.openMainCallback = openMainCallback;
  }

  createTray() {
    const icon = nativeImage.createFromPath(this.iconPath);
    this.tray = new Tray(icon);
    this.tray.setToolTip('PlayWell');

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open App', click: () => { if (this.openMainCallback) this.openMainCallback(); } },
      { label: 'Quit', click: () => app.quit() }
    ]);
    this.tray.setContextMenu(contextMenu);

    // Create tray window
    this.createTrayWindow();

    // Toggle tray window on click
    this.tray.on('click', (event, bounds) => {
      if (this.trayWindow.isVisible()) {
        this.trayWindow.hide();
      } else {
        // Position the window just above the tray icon
        const x = Math.round(bounds.x + (bounds.width / 2) - (this.trayWindow.getSize()[0] / 2));
        const y = Math.round(bounds.y - this.trayWindow.getSize()[1]);
        this.trayWindow.setPosition(x, y);
        this.trayWindow.show();
        this.trayWindow.focus();
      }
    });
  }

  createTrayWindow() {
    this.trayWindow = new BrowserWindow({
      width: 350,
      height: 450,
      show: false,
      frame: false,
      resizable: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      // When running the renderer with Vite in dev mode, load from Vite dev server
      const devUrl = new URL('/tray-menu.html', process.env.VITE_DEV_SERVER_URL).toString();
      this.trayWindow.loadURL(devUrl);
    } else {
      // In production or when running without Vite, load the local file
      const filePath = path.join(app.getAppPath(), 'tray-menu.html');
      this.trayWindow.loadFile(filePath);
    }
    this.trayWindow.on('blur', () => {
      // Prevent hiding when dev tools are open
      if (!this.trayWindow.webContents.isDevToolsOpened()) {
        this.trayWindow.hide();
      }
    });
  }
}

module.exports = TrayManager;