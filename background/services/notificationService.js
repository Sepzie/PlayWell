const { Notification } = require('electron');
const { NotificationPreferencesRepository } = require('../repository/notificationPreferences.js');
const { UserRepository } = require('../repository/user.js');
const path = require('path');

/**
 * NotificationService manages system notifications for game tracking events.
 * It checks user preferences before showing notifications.
 */
class NotificationService {
  /**
   * Shows a notification for a newly detected game.
   *
   * @param {string} gameName - The name of the detected game
   */
  static async notifyNewGameDetected(gameName) {
    const user = UserRepository.getCurrentUser();
    if (!user) return;

    const prefs = await NotificationPreferencesRepository.getPreferences(user.id);
    if (!prefs.newGameDetected) return;

    const notification = new Notification({
      title: 'New Game Detected',
      body: `PlayWell detected "${gameName}". You can manage this game in Settings.`,
      icon: path.join(__dirname, '../../src/public/icon.png'),
      silent: false
    });

    notification.show();
  }

  /**
   * Shows a notification when a game starts.
   *
   * @param {string} gameName - The name of the game
   */
  static async notifyGameStarted(gameName) {
    const user = UserRepository.getCurrentUser();
    if (!user) return;

    const prefs = await NotificationPreferencesRepository.getPreferences(user.id);
    if (!prefs.gameStarted) return;

    const notification = new Notification({
      title: 'Game Started',
      body: `You started playing "${gameName}"`,
      icon: path.join(__dirname, '../../src/public/icon.png'),
      silent: true
    });

    notification.show();
  }

  /**
   * Shows a notification when a game stops.
   *
   * @param {string} gameName - The name of the game
   * @param {number} durationSeconds - How long the game was played in seconds
   */
  static async notifyGameStopped(gameName, durationSeconds) {
    const user = UserRepository.getCurrentUser();
    if (!user) return;

    const prefs = await NotificationPreferencesRepository.getPreferences(user.id);
    if (!prefs.gameStopped) return;

    // Format duration
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    let durationText = '';
    
    if (hours > 0) {
      durationText = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      durationText = `${minutes}m`;
    } else {
      durationText = `${durationSeconds}s`;
    }

    const notification = new Notification({
      title: 'Game Stopped',
      body: `You stopped playing "${gameName}". Session: ${durationText}`,
      icon: path.join(__dirname, '../../src/public/icon.png'),
      silent: true
    });

    notification.show();
  }
}

module.exports = { NotificationService };

