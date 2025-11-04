const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const LimitRepository = {
    getUserLimits: async (userId) => { return []; },
    setLimit: async (userId, type, limitSeconds) => { return {}; },
    deleteLimit: async (userId, type) => { return {}; },
    getLimitForDay: async (userId, dayOfWeek) => { return null; }
};

/**
 * Gets all limits for a user.
 *
 * @param {number} userId - The user's ID
 * @returns {Array} Array of limit objects
 */
LimitRepository.getUserLimits = async (userId) => {
    try {
        const limits = await getPrisma().limit.findMany({
            where: { userId }
        });
        console.info(`${repo}[LimitRepository]${reset} Found ${limits.length} limits for user ${userId}`);
        return limits;
    } catch (error) {
        console.error(`${repo}[LimitRepository]${err} Error fetching limits: ${error}${reset}`);
        return [];
    }
};

/**
 * Creates or updates a limit for a specific day.
 * Uses upsert to prevent duplicates (unique constraint on userId + type).
 *
 * @param {number} userId - The user's ID
 * @param {string} type - Day of week enum value (SUNDAY, MONDAY, etc.)
 * @param {number} limitSeconds - Limit in seconds
 * @returns {Object} The created/updated limit object
 */
LimitRepository.setLimit = async (userId, type, limitSeconds) => {
    try {
        const limit = await getPrisma().limit.upsert({
            where: {
                userId_type: { userId, type }
            },
            update: {
                limitSeconds
            },
            create: {
                userId,
                type,
                limitSeconds
            }
        });
        console.info(`${repo}[LimitRepository]${reset} Set limit for ${type}: ${limitSeconds} seconds`);
        return limit;
    } catch (error) {
        console.error(`${repo}[LimitRepository]${err} Error setting limit: ${error}${reset}`);
        return {};
    }
};

/**
 * Deletes a limit for a specific day.
 *
 * @param {number} userId - The user's ID
 * @param {string} type - Day of week enum value (SUNDAY, MONDAY, etc.)
 * @returns {Object} The deleted limit object or empty object if not found
 */
LimitRepository.deleteLimit = async (userId, type) => {
    try {
        const limit = await getPrisma().limit.delete({
            where: {
                userId_type: { userId, type }
            }
        });
        console.info(`${repo}[LimitRepository]${reset} Deleted limit for ${type}`);
        return limit;
    } catch (error) {
        // If not found, it's not an error - just return empty object
        if (error.code === 'P2025') {
            console.info(`${repo}[LimitRepository]${reset} No limit found to delete for ${type}`);
            return {};
        }
        console.error(`${repo}[LimitRepository]${err} Error deleting limit: ${error}${reset}`);
        return {};
    }
};

/**
 * Gets the limit for a specific day of the week.
 *
 * @param {number} userId - The user's ID
 * @param {string} dayOfWeek - Day of week enum value (SUNDAY, MONDAY, etc.)
 * @returns {Object|null} The limit object or null if not found
 */
LimitRepository.getLimitForDay = async (userId, dayOfWeek) => {
    try {
        const limit = await getPrisma().limit.findUnique({
            where: {
                userId_type: { userId, type: dayOfWeek }
            }
        });
        return limit;
    } catch (error) {
        console.error(`${repo}[LimitRepository]${err} Error fetching limit for ${dayOfWeek}: ${error}${reset}`);
        return null;
    }
};

module.exports = { LimitRepository };
