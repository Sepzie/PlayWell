const { getPrisma } = require('../prismaClient.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const NotificationPreferencesRepository = {
  getPreferences: async (userId) => { return {}; },
  updatePreferences: async (userId, prefs) => { return {}; },
  createDefaultPreferences: async (userId) => { return {}; }
};

/**
 * Gets notification preferences for a user.
 * If preferences don't exist, creates default ones.
 *
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} The notification preferences
 */
NotificationPreferencesRepository.getPreferences = async (userId) => {
  try {
    let prefs = await getPrisma().notificationPreferences.findUnique({
      where: { userId: userId }
    });

    // If no preferences exist, create default ones
    if (!prefs) {
      prefs = await NotificationPreferencesRepository.createDefaultPreferences(userId);
    }

    return prefs;
  } catch (error) {
    console.error(`${repo}[NotificationPreferencesRepository]${err} ${error}${reset}`);
    return {
      newGameDetected: true,
      gameStarted: true,
      gameStopped: true
    };
  }
};

/**
 * Updates notification preferences for a user.
 *
 * @param {number} userId - The user ID
 * @param {Object} prefs - Object containing preference fields to update
 * @param {boolean} prefs.newGameDetected - Whether to notify on new game detection
 * @param {boolean} prefs.gameStarted - Whether to notify when game starts
 * @param {boolean} prefs.gameStopped - Whether to notify when game stops
 * @returns {Promise<Object>} Updated preferences
 */
NotificationPreferencesRepository.updatePreferences = async (userId, prefs) => {
  try {
    const updated = await getPrisma().notificationPreferences.upsert({
      where: { userId: userId },
      update: prefs,
      create: {
        userId: userId,
        newGameDetected: prefs.newGameDetected !== undefined ? prefs.newGameDetected : true,
        gameStarted: prefs.gameStarted !== undefined ? prefs.gameStarted : true,
        gameStopped: prefs.gameStopped !== undefined ? prefs.gameStopped : true
      }
    });

    console.info(`${repo}[NotificationPreferencesRepository]${reset} Updated preferences for user ${userId}`);
    return updated;
  } catch (error) {
    console.error(`${repo}[NotificationPreferencesRepository]${err} ${error}${reset}`);
    return {};
  }
};

/**
 * Creates default notification preferences for a user.
 *
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} Created preferences
 */
NotificationPreferencesRepository.createDefaultPreferences = async (userId) => {
  try {
    const prefs = await getPrisma().notificationPreferences.create({
      data: {
        userId: userId,
        newGameDetected: true,
        gameStarted: true,
        gameStopped: true
      }
    });

    console.info(`${repo}[NotificationPreferencesRepository]${reset} Created default preferences for user ${userId}`);
    return prefs;
  } catch (error) {
    console.error(`${repo}[NotificationPreferencesRepository]${err} ${error}${reset}`);
    return {
      newGameDetected: true,
      gameStarted: true,
      gameStopped: true
    };
  }
};

module.exports = { NotificationPreferencesRepository };

