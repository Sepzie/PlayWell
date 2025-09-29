const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app-version'),
  
  // TODO: Add more IPC methods as needed
  // Example:
  // getGameSessions: () => ipcRenderer.invoke('get-game-sessions'),
  // saveGameSession: (session) => ipcRenderer.invoke('save-game-session', session)
});


