const { LimitRepository } = require('../repository/limit.js');
const { StatsService } = require('./statsService.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { service, reset, err } = debug_colors;

/**
 * Maps JavaScript day number (0-6) to DayOfWeek enum values
 */
const DAY_OF_WEEK_MAP = {
    0: 'SUNDAY',
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY'
};

/**
 * LimitsService - Business logic for daily gaming limits.
 * Calculates time remaining, over-limit status, and manages limit CRUD operations.
 */
const LimitsService = {
    getUserLimits: async (userId) => { return []; },
    setLimit: async (userId, type, limitMinutes) => { return {}; },
    deleteLimit: async (userId, type) => { return {}; },
    getTodayLimit: async (userId) => { return null; },
    getLimitStatus: async (userId) => { return {}; }
};

/**
 * Gets all limits for a user.
 *
 * @param {number} userId - The user's ID
 * @returns {Array} Array of limit objects
 */
LimitsService.getUserLimits = async (userId) => {
    try {
        return await LimitRepository.getUserLimits(userId);
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error getting user limits:`, error, reset);
        return [];
    }
};

/**
 * Sets a limit for a specific day.
 *
 * @param {number} userId - The user's ID
 * @param {string} type - Day of week enum value (SUNDAY, MONDAY, etc.)
 * @param {number} limitMinutes - Limit in minutes
 * @returns {Object} The created/updated limit object
 */
LimitsService.setLimit = async (userId, type, limitMinutes) => {
    try {
        return await LimitRepository.setLimit(userId, type, limitMinutes);
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error setting limit:`, error, reset);
        return {};
    }
};

/**
 * Deletes a limit for a specific day.
 *
 * @param {number} userId - The user's ID
 * @param {string} type - Day of week enum value (SUNDAY, MONDAY, etc.)
 * @returns {Object} The deleted limit object
 */
LimitsService.deleteLimit = async (userId, type) => {
    try {
        return await LimitRepository.deleteLimit(userId, type);
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error deleting limit:`, error, reset);
        return {};
    }
};

/**
 * Gets the limit for today based on current day of week.
 *
 * @param {number} userId - The user's ID
 * @returns {Object|null} The limit object or null if no limit set for today
 */
LimitsService.getTodayLimit = async (userId) => {
    try {
        const today = new Date();
        const dayOfWeek = DAY_OF_WEEK_MAP[today.getDay()];

        const limit = await LimitRepository.getLimitForDay(userId, dayOfWeek);
        console.info(`${service}[LimitsService]${reset} Today is ${dayOfWeek}, limit: ${limit ? limit.limitMinutes + ' minutes' : 'none'}`);

        return limit;
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error getting today's limit:`, error, reset);
        return null;
    }
};

/**
 * Gets comprehensive limit status including time remaining and over-limit state.
 * This is the main method used by the timer and UI.
 *
 * @param {number} userId - The user's ID
 * @returns {Object} Status object with:
 *   - hasLimit: boolean - whether a limit is set for today
 *   - limitMinutes: number - the limit in minutes (0 if no limit)
 *   - playedMinutes: number - time played today in minutes
 *   - remainingMinutes: number - time remaining (negative if over limit)
 *   - isOverLimit: boolean - whether user has exceeded the limit
 *   - dayOfWeek: string - current day name
 */
LimitsService.getLimitStatus = async (userId) => {
    try {
        // Get today's limit
        const todayLimit = await LimitsService.getTodayLimit(userId);

        // Get today's playtime from stats
        const stats = await StatsService.getGameStats({ period: 'today' });
        const playedMinutes = stats.reduce((sum, game) => sum + game.playTime, 0);

        const today = new Date();
        const dayOfWeek = DAY_OF_WEEK_MAP[today.getDay()];

        // If no limit set, return status with no limit
        if (!todayLimit) {
            return {
                hasLimit: false,
                limitMinutes: 0,
                playedMinutes: Math.round(playedMinutes),
                remainingMinutes: 0,
                isOverLimit: false,
                dayOfWeek
            };
        }

        // Calculate remaining time
        const remainingMinutes = todayLimit.limitMinutes - playedMinutes;
        const isOverLimit = remainingMinutes < 0;

        console.info(`${service}[LimitsService]${reset} Limit status - Limit: ${todayLimit.limitMinutes}m, Played: ${Math.round(playedMinutes)}m, Remaining: ${Math.round(remainingMinutes)}m, Over: ${isOverLimit}`);

        return {
            hasLimit: true,
            limitMinutes: todayLimit.limitMinutes,
            playedMinutes: Math.round(playedMinutes),
            remainingMinutes: Math.round(remainingMinutes),
            isOverLimit,
            dayOfWeek
        };
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error getting limit status:`, error, reset);
        return {
            hasLimit: false,
            limitMinutes: 0,
            playedMinutes: 0,
            remainingMinutes: 0,
            isOverLimit: false,
            dayOfWeek: 'UNKNOWN'
        };
    }
};

module.exports = { LimitsService, DAY_OF_WEEK_MAP };
