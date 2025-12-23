const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../debugColors.js');
const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');
const { repo, reset, err } = debug_colors;

const GamingSessionRepository = {
    // FUNCTIONS UNDER HERE REQUIRE A USER TO BE LOADED. See UserRepository.loadNewOrReturningUser
    getAllGamingSessions: async () => {return []},
    deleteAllGamingSessions: async () => {return []},

    getGamingSessionById: async (gsid) => {return {}},

    startGamingSession: async (gameId, startingDurationSeconds) => {return {}},
    updateGamingSession: async (gsid, durationSeconds) => {return {}},
    endGamingSession: async (gsid, durationSeconds) => {return {}},

    getGameStats: async (startDate, endDate) => {return []}
};

/**
 * Returns all GamingSessions of currently loaded User.
 *
 * @returns JSON Array of GamingSessions with game details included
 */
GamingSessionRepository.getAllGamingSessions = async () => {
    try {
        res = await getPrisma().gamingSession.findMany({
            where: {userId: UserRepository.getCurrentUser().id},
            include: {
                gamePlayed: true // Include game details
            }
        });
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return [];
    }
    return res;
}

/**
 * Deletes all GamingSessions of currently loaded User.
 * 
 * @returns an int representing the number of deleted GamingSession records
 */
GamingSessionRepository.deleteAllGamingSessions = async () => {
    try {
        res = await getPrisma().game.deleteMany({
            where: {userId: UserRepository.getCurrentUser().id}
        })
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return {};
    }
    console.info(`${repo}[GamingSessionRepository]${reset} Deleted ${res.count} session(s)`);
    return res;
}

/**
 * Returns the GamingSession associated with unique gsid.
 * 
 * @param {string} gsid id of the desired GamingSession
 * @returns GamingSession JSON object
 */
GamingSessionRepository.getGamingSessionById = async (gsid) => {
    try {
        res = await getPrisma().gamingSession.findUnique({
            where: {id: gsid}
        })
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return {};
    }
    return res;
}

/**
 * Starts a GamingSession.
 * This creates a GamingSession record in database.
 *
 * @param {string} game_id the id of a Game object
 * @param {int} startingDurationSeconds non-negative integer representing a starting duration in seconds
 * @returns the created GamingSession JSON object
 */
GamingSessionRepository.startGamingSession = async (game_id, startingDurationSeconds) => {
    try {
        if (startingDurationSeconds < 0) {
            throw Error("Can't have negative durationSeconds");
        }

        res = await getPrisma().gamingSession.create({
            data: {
                gameId: game_id,
                durationSeconds: startingDurationSeconds,
                userId: UserRepository.getCurrentUser().id
            }
        });
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return {};
    }
    u = res;
    console.info(`${repo}[GamingSessionRepository]${reset} Started session for game ID: ${res.gameId}`);
    return res;
}

/**
 * Updates an active GamingSession with current duration.
 * This can be called multiple times during gameplay to keep the database in sync.
 * Does NOT update endTime, so the session remains "active" (endTime != updatedAt).
 *
 * @param {string} gsid id of the GamingSession
 * @param {number} currentDurationSeconds non-negative integer representing current duration in seconds
 * @returns the updated GamingSession JSON object
 */
GamingSessionRepository.updateGamingSession = async (gsid, currentDurationSeconds) => {
    try {
        if (currentDurationSeconds < 0) {
            throw Error("Can't have negative durationSeconds");
        }

        res = await getPrisma().gamingSession.update({
            where: {
                id: gsid,
                userId: UserRepository.getCurrentUser().id
            },
            data: {
                durationSeconds: currentDurationSeconds
                // Note: NOT updating endTime, it will auto-update via @updatedAt
            }
        });
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return {};
    }
    return res;
}

/**
 * Ends a GamingSession.
 * This updates a GamingSession record with final duration and marks it as complete.
 *
 * @param {string} gsid id of the GamingSession
 * @param {number} finalDurationSeconds non-negative integer representing final duration in seconds
 * @returns the ended GamingSession JSON object
 */
GamingSessionRepository.endGamingSession = async (gsid, finalDurationSeconds) => {
    try {
        if (finalDurationSeconds < 0) {
            throw Error("Can't have negative durationSeconds");
        }

        // Final update with the ending duration
        res = await getPrisma().gamingSession.update({
            where: {
                id: gsid,
                userId: UserRepository.getCurrentUser().id
            },
            data: {
                durationSeconds: finalDurationSeconds
                // endTime will auto-update via @updatedAt
            }
        });
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return {};
    }
    console.info(`${repo}[GamingSessionRepository]${reset} Ended session (${Math.round(res.durationSeconds / 60)}m)`);
    return res;
}

/**
 * Gets aggregated gaming statistics for all games within a date range.
 * Aggregates GamingSessions by game and calculates:
 * - Total playtime
 * - Daily average playtime (total / days actually played)
 * - Average days per week played
 *
 * @param {Date} startDate - Start of date range (inclusive)
 * @param {Date} endDate - End of date range (inclusive)
 * @returns {Array} Array of game stats objects with structure:
 *   [{
 *     name: string,
 *     playTime: number (in minutes),
 *     dailyAverage: number (in minutes),
 *     averageDaysPerWeek: number
 *   }]
 */
GamingSessionRepository.getGameStats = async (startDate, endDate) => {
    try {
        // Fetch all gaming sessions for the current user within the date range
        // Filter by endTime to include sessions that finished in this period
        // (even if they started before the period began)
        const sessions = await getPrisma().gamingSession.findMany({
            where: {
                userId: UserRepository.getCurrentUser().id,
                endTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                gamePlayed: true // Include game details
            }
        });

        // Group sessions by game and aggregate stats
        const gameStatsMap = {};

        sessions.forEach(session => {
            const gameId = session.gameId;
            const gameName = session.gamePlayed.name;
            const durationSeconds = session.durationSeconds || 0;

            // Skip sessions with no duration (incomplete/stale sessions)
            if (durationSeconds <= 0) {
                return;
            }

            // Get date (without time) for counting unique play days
            const playDate = session.startTime.toISOString().split('T')[0];

            if (!gameStatsMap[gameId]) {
                gameStatsMap[gameId] = {
                    name: gameName,
                    totalPlayTime: 0,
                    playDates: new Set()
                };
            }

            // Convert seconds to minutes for stats display
            gameStatsMap[gameId].totalPlayTime += (durationSeconds / 60);
            gameStatsMap[gameId].playDates.add(playDate);
        });

        // Calculate final stats
        const stats = Object.values(gameStatsMap).map(game => {
            const totalPlayTime = game.totalPlayTime;
            const uniqueDaysPlayed = game.playDates.size;

            // Daily average: total playtime / days actually played (excludes zero-play days)
            const dailyAverage = uniqueDaysPlayed > 0 ? totalPlayTime / uniqueDaysPlayed : 0;

            // Calculate weeks in the date range
            const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;
            const dateRangeDuration = endDate - startDate;
            const weeksInRange = dateRangeDuration / millisecondsInWeek;

            // Average days per week: unique days played / weeks in range
            const averageDaysPerWeek = weeksInRange > 0 ? uniqueDaysPlayed / weeksInRange : uniqueDaysPlayed;

            return {
                name: game.name,
                playTime: Math.round(totalPlayTime),
                dailyAverage: Math.round(dailyAverage),
                averageDaysPerWeek: parseFloat(averageDaysPerWeek.toFixed(1))
            };
        });

        console.info(`${repo}[GamingSessionRepository]${reset} Calculated stats for ${stats.length} game(s)`);
        return stats;

    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return [];
    }
}

module.exports = {GamingSessionRepository};