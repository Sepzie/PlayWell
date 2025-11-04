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

  ,
  // Timer APIs
  onTimerUpdate: (callback) => {
    const listener = (event, state) => callback(state);
    ipcRenderer.on('timer-update', listener);
    return () => ipcRenderer.removeListener('timer-update', listener);
  },
  startTimer: (durationSeconds) => ipcRenderer.send('timer-start', durationSeconds),
  pauseTimer: () => ipcRenderer.send('timer-pause'),
  resumeTimer: () => ipcRenderer.send('timer-resume'),
  resetTimer: () => ipcRenderer.send('timer-reset'),
  forceTimerUpdate: () => ipcRenderer.send('timer-force-update'),
  getTimerState: () => ipcRenderer.invoke('timer-get-state'),

  // Stats APIs
  getGameStats: (options) => ipcRenderer.invoke('get-game-stats', options),

  // History APIs
  getHistoryData: (options) => ipcRenderer.invoke('get-history-data', options),

  // Limits APIs
  getLimits: () => ipcRenderer.invoke('get-limits'),
  setLimit: (type, limitMinutes) => ipcRenderer.invoke('set-limit', { type, limitMinutes }),
  deleteLimit: (type) => ipcRenderer.invoke('delete-limit', { type }),
  getLimitStatus: () => ipcRenderer.invoke('get-limit-status')

  // TODO: Add more IPC methods as needed
  // Example:
  // getGameSessions: () => ipcRenderer.invoke('get-game-sessions'),
  // saveGameSession: (session) => ipcRenderer.invoke('save-game-session', session)
});


