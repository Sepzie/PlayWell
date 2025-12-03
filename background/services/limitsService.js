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
        console.error(`${service}[LimitsService]${err} Error getting user limits:${reset}`, error);
        return [];
    }
};

/**
 * Sets a limit for a specific day.
 *
 * @param {number} userId - The user's ID
 * @param {string} type - Day of week enum value (SUNDAY, MONDAY, etc.)
 * @param {number} limitSeconds - Limit in seconds
 * @returns {Object} The created/updated limit object
 */
LimitsService.setLimit = async (userId, type, limitSeconds) => {
    try {
        return await LimitRepository.setLimit(userId, type, limitSeconds);
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error setting limit:${reset}`, error);
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
        console.error(`${service}[LimitsService]${err} Error deleting limit:${reset}`, error);
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
        return limit;
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error getting today's limit:${reset}`, error);
        return null;
    }
};

/**
 * Gets comprehensive limit status including time remaining and over-limit state.
 * This is the main method used by the timer and UI.
 * 
 * For active sessions, calculates elapsed time in real-time from session start time,
 * eliminating race conditions with DB updates.
 *
 * @param {number} userId - The user's ID
 * @returns {Object} Status object with:
 *   - hasLimit: boolean - whether a limit is set for today
 *   - limitSeconds: number - the limit in seconds (0 if no limit)
 *   - playedSeconds: number - time played today in seconds
 *   - remainingSeconds: number - time remaining in seconds (negative if over limit)
 *   - isOverLimit: boolean - whether user has exceeded the limit
 *   - dayOfWeek: string - current day name
 */
LimitsService.getLimitStatus = async (userId) => {
    try {
        // Get today's limit
        const todayLimit = await LimitsService.getTodayLimit(userId);

        // Get today's playtime - uses real-time calculation for active sessions
        const playedSeconds = await LimitsService.getTodayPlaytimeInSeconds(userId);

        const today = new Date();
        const dayOfWeek = DAY_OF_WEEK_MAP[today.getDay()];

        // If no limit set, return status with no limit
        if (!todayLimit) {
            return {
                hasLimit: false,
                limitSeconds: 0,
                playedSeconds,
                remainingSeconds: 0,
                isOverLimit: false,
                dayOfWeek
            };
        }

        // Calculate remaining time in seconds
        const remainingSeconds = todayLimit.limitSeconds - playedSeconds;
        const isOverLimit = remainingSeconds < 0;

        return {
            hasLimit: true,
            limitSeconds: todayLimit.limitSeconds,
            playedSeconds,
            remainingSeconds,
            isOverLimit,
            dayOfWeek
        };
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error getting limit status:${reset}`, error);
        return {
            hasLimit: false,
            limitSeconds: 0,
            playedSeconds: 0,
            remainingSeconds: 0,
            isOverLimit: false,
            dayOfWeek: 'UNKNOWN'
        };
    }
};

/**
 * Gets today's total playtime in seconds with real-time accuracy.
 * For active sessions, calculates elapsed time from startTime to NOW.
 * For completed sessions, uses stored durationSeconds.
 *
 * @param {number} userId - The user's ID
 * @returns {number} Total playtime in seconds for today
 */
LimitsService.getTodayPlaytimeInSeconds = async (userId) => {
    try {
        const { GamingSessionRepository } = require('../repository/gamingSession.js');
        const { gameTracker } = require('../index.js');
        
        // Get today's date range
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        // Get all sessions from database
        const allSessions = await GamingSessionRepository.getAllGamingSessions();
        
        // Filter to today's sessions
        const todaySessions = allSessions.filter(session => {
            const sessionStart = new Date(session.startTime);
            return sessionStart >= startOfToday && sessionStart <= endOfToday;
        });

        // Get currently active session IDs from GameTracker
        const activeSessions = gameTracker.getActiveGamingSessions();
        const activeSessionIds = Object.values(activeSessions).map(s => s.id);

        let totalSeconds = 0;

        for (const session of todaySessions) {
            if (activeSessionIds.includes(session.id)) {
                // Active session: calculate real-time elapsed time
                const sessionStart = new Date(session.startTime);
                const elapsedMs = now - sessionStart;
                const elapsedSeconds = Math.floor(elapsedMs / 1000);
                totalSeconds += elapsedSeconds;
            } else {
                // Completed session: use stored duration
                totalSeconds += (session.durationSeconds || 0);
            }
        }

        return totalSeconds;
    } catch (error) {
        console.error(`${service}[LimitsService]${err} Error calculating today's playtime:${reset}`, error);
        return 0;
    }
};

module.exports = { LimitsService, DAY_OF_WEEK_MAP };
