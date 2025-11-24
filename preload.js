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
  forceTimerUpdate: () => ipcRenderer.send('timer-force-update'),
  getTimerState: () => ipcRenderer.invoke('timer-get-state'),

  // Stats APIs
  getGameStats: (options) => ipcRenderer.invoke('get-game-stats', options),

  // History APIs
  getHistoryData: (options) => ipcRenderer.invoke('get-history-data', options),
  getOldestAndNewestSessionDates: () => ipcRenderer.invoke('get-oldest-and-newest-session-dates'),
  
  // Limits APIs
  getLimits: () => ipcRenderer.invoke('get-limits'),
  setLimit: (type, limitMinutes) => ipcRenderer.invoke('set-limit', { type, limitMinutes }),
  deleteLimit: (type) => ipcRenderer.invoke('delete-limit', { type }),
  getLimitStatus: () => ipcRenderer.invoke('get-limit-status'),

  // Game management APIs
  getAllGames: () => ipcRenderer.invoke('get-all-games'),
  enableGame: (gameId) => ipcRenderer.invoke('enable-game', { gameId }),
  disableGame: (gameId) => ipcRenderer.invoke('disable-game', { gameId }),
  deleteGame: (gameId) => ipcRenderer.invoke('delete-game', { gameId }),
  addManualGame: (name, location) => ipcRenderer.invoke('add-manual-game', { name, location }),

  // Notification preferences APIs
  getNotificationPreferences: () => ipcRenderer.invoke('get-notification-preferences'),
  updateNotificationPreferences: (prefs) => ipcRenderer.invoke('update-notification-preferences', prefs),

  // Currently playing game listener
  onCurrentlyPlayingChanged: (callback) => {
    const listener = (event, gameName) => callback(gameName);
    ipcRenderer.on('currently-playing-changed', listener);
    return () => ipcRenderer.removeListener('currently-playing-changed', listener);
  }
});


