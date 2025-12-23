const csv = require('csvtojson');
const BackgroundService = require('./BackgroundService.js');
const { debug_colors } = require('../debugColors.js');
const { proctracker, reset, err } = debug_colors;
const util = require('node:util');
const execFile = util.promisify(require('node:child_process').execFile);

const INTERVAL_SECONDS = 2;

/**
 * FocusTracker extends BackgroundService to track which window is currently in focus.
 * It periodically checks the active window and emits events when focus changes.
 *
 * Emits 'focus-changed' event with {processId, processName, windowTitle, executablePath} when focus changes.
 */
class FocusTracker extends BackgroundService {
  constructor() {
    super('FocusTracker');
    this.currentFocusedProcess = null; // {processId, processName, windowTitle, executablePath}
    this.gameProcesses = {}; // {processId: {gameId, gameName, executablePath, lastFocusedTime}}
  }

  /**
   * Gets the currently focused window process information.
   * Uses PowerShell to query Windows API for active window.
   *
   * @returns {Promise<Object|null>} Object with processId, processName, windowTitle, executablePath or null if none
   */
  async getFocusedWindow() {
    try {
      // PowerShell command to get the focused window with all necessary details
      const psCommand = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          public class Win32 {
            [DllImport("user32.dll")]
            public static extern IntPtr GetForegroundWindow();
            [DllImport("user32.dll")]
            public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
          }
"@
        $hwnd = [Win32]::GetForegroundWindow()
        $processId = 0
        [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
        if ($processId -ne 0) {
          Get-Process -Id $processId -ErrorAction SilentlyContinue | 
            Where-Object {$_.MainWindowHandle -ne 0} | 
            Select-Object Id, ProcessName, MainWindowTitle, Path | 
            ConvertTo-Json
        }
      `;

      const { stdout, stderr } = await execFile('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        psCommand
      ]);

      if (stderr && stderr.trim()) {
        console.error(`${proctracker}[FocusTracker]${err}`, stderr, `${reset}`);
        return null;
      }

      if (!stdout || !stdout.trim()) {
        return null;
      }

      const result = JSON.parse(stdout.trim());
      
      if (!result || !result.Id) {
        return null;
      }

      return {
        processId: result.Id,
        processName: result.ProcessName,
        windowTitle: result.MainWindowTitle || '',
        executablePath: result.Path || ''
      };
    } catch (error) {
      // Silently handle errors - focus tracking is non-critical
      return null;
    }
  }

  /**
   * Registers a game process to track for focus.
   *
   * @param {number} processId - The process ID to track
   * @param {string} gameId - The game ID from the database
   * @param {string} gameName - The game name
   * @param {string} executablePath - The executable path
   */
  registerGameProcess(processId, gameId, gameName, executablePath) {
    this.gameProcesses[processId] = {
      gameId,
      gameName,
      executablePath,
      lastFocusedTime: null
    };
  }

  /**
   * Unregisters a game process from tracking.
   *
   * @param {number} processId - The process ID to unregister
   */
  unregisterGameProcess(processId) {
    delete this.gameProcesses[processId];
  }

  /**
   * Clears all registered game processes.
   */
  clearGameProcesses() {
    this.gameProcesses = {};
  }

  /**
   * Gets information about a registered game process by process ID.
   *
   * @param {number} processId - The process ID to look up
   * @returns {Object|null} Game process info or null if not registered
   */
  getGameProcess(processId) {
    return this.gameProcesses[processId] || null;
  }

  /**
   * Gets all registered game processes.
   *
   * @returns {Object} Map of process IDs to game process info
   */
  getAllGameProcesses() {
    return { ...this.gameProcesses };
  }

  /**
   * Called on each interval tick to check focused window.
   */
  async _onIntervalTick() {
    const focusedWindow = await this.getFocusedWindow();

    // Check if focus has changed
    const previousProcessId = this.currentFocusedProcess?.processId;
    const currentProcessId = focusedWindow?.processId;

    if (previousProcessId !== currentProcessId) {
      // Focus changed
      this.currentFocusedProcess = focusedWindow;

      // Check if the newly focused process is a tracked game
      const gameInfo = focusedWindow ? this.getGameProcess(focusedWindow.processId) : null;

      if (gameInfo) {
        gameInfo.lastFocusedTime = Date.now();
        this.emit('game-focused', {
          ...gameInfo,
          windowTitle: focusedWindow.windowTitle
        });
      } else if (previousProcessId && this.getGameProcess(previousProcessId)) {
        // A tracked game lost focus
        this.emit('game-unfocused', {
          processId: previousProcessId,
          ...this.getGameProcess(previousProcessId)
        });
      }

      this.emit('focus-changed', focusedWindow);
    }
  }

  /**
   * Starts the focus tracking service.
   */
  startTracking() {
    this.start();
    this._startInterval(1000 * INTERVAL_SECONDS);
    this._log('info', 'Focus tracking started');
  }

  /**
   * Stops the focus tracking service.
   */
  stopTracking() {
    this.stop();
    this.clearGameProcesses();
    this._log('info', 'Focus tracking stopped');
  }

  /**
   * Gets the currently focused window info.
   *
   * @returns {Object|null} Current focused window or null
   */
  getCurrentFocus() {
    return this.currentFocusedProcess;
  }
}

module.exports = { FocusTracker };

