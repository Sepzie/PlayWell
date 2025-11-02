const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app-version'),
  
  // Allow renderer to listen for navigation requests from the main process
  onNavigate: (callback) => {
    const listener = (event, route) => callback(route);
    ipcRenderer.on('navigate', listener);
    return () => ipcRenderer.removeListener('navigate', listener);
  },

  // Request the main process to open the Limits page
  openLimits: () => ipcRenderer.send('open-limits'),

  // Request the main process to open/focus the main application window
  openMain: () => ipcRenderer.send('open-main-window')

  // TODO: Add more IPC methods as needed
  // Example:
  // getGameSessions: () => ipcRenderer.invoke('get-game-sessions'),
  // saveGameSession: (session) => ipcRenderer.invoke('save-game-session', session)
});


