const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');
const { repo, reset, err } = debug_colors;

const GamingSessionRepository = {
    // FUNCTIONS UNDER HERE REQUIRE A USER TO BE LOADED. See UserRepository.loadNewOrReturningUser
    getAllGamingSessions: async () => {return []},
    deleteAllGamingSessions: async () => {return []},

    getGamingSessionById: async (gsid) => {return {}},

    startGamingSession: async (gameId, startingDurationMinutes) => {return {}},
    endGamingSession: async (gsid, durationMinutes) => {return {}},

    getGameStats: async (startDate, endDate) => {return []}
};

/**
 * Returns all GamingSessions of currently loaded User.
 * 
 * @returns JSON Array of GamingSessions
 */
GamingSessionRepository.getAllGamingSessions = async () => {
    try {
        res = await getPrisma().gamingSession.findMany({
            where: {userId: UserRepository.getCurrentUser().id},
        });
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return [];
    }
    console.info(`${repo}[GamingSessionRepository]${reset} All gsessions: `, res);
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
    console.info(`${repo}[GamingSessionRepository]${reset} Deleted gessions: `, res);
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
    console.info(`${repo}[GamingSessionRepository]${reset} Found gsession record: `, res);
    return res;
}

/**
 * Starts a GamingSession.
 * This creates a GamingSession record in database.
 * 
 * @param {string} game_id the id of a Game object 
 * @param {int} startingDurationMinutes non-negative integer representing a starting duration in minutes 
 * @returns the created GamingSession JSON object
 */
GamingSessionRepository.startGamingSession = async (game_id, startingDurationMinutes) => {
    try {
        if (startingDurationMinutes < 0) {
            throw Error("Can't have negative durationMinutes");
        }

        res = await getPrisma().gamingSession.create({
            data: {
                gameId: game_id,
                durationMinutes: startingDurationMinutes,
                userId: UserRepository.getCurrentUser().id
            }
        });
    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return {};
    }
    u = res;
    console.info(`${repo}[GamingSessionRepository]${reset} Started new gsession: `, res);
    return res;
}

/**
 * Ends a GamingSession.
 * This updates a GamingSession record in database, then disables all subsequent updates to this record. This function
 * throws an error if attempting more than one update to the database. Crucially, this indicates that GamingSessions aren't
 * updated live, as a GamingSession needs to end first before the record is updated.
 * 
 * @param {string} gsid id of the GamingSession
 * @param {*} finalDurationMinutes non-negative integer that must not be less than the starting duration
 * @returns the ended GamingSession JSON object
 */
GamingSessionRepository.endGamingSession = async (gsid, finalDurationMinutes) => {
    try {
        if (finalDurationMinutes < 0) {
            throw Error("Can't have negative durationMinutes");
        }

        res = await getPrisma().gamingSession.update({
            where: {
                id: gsid,
                userId: UserRepository.getCurrentUser().id,
                endTime: {equals: getPrisma().gamingSession.fields.startTime} // if startTime != endTime, it must have already ended
            },
            data: {
                durationMinutes: finalDurationMinutes
            }
        });
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            console.error(`${repo}[GamingSessionRepository]${err} Update failed. Gaming Session '${gsid}' might already have ended!${reset}`);
            return {};
        }
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return {};
    }
    u = res;
    console.info(`${repo}[GamingSessionRepository]${reset} Ended gsession: `, res);
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
        const sessions = await getPrisma().gamingSession.findMany({
            where: {
                userId: UserRepository.getCurrentUser().id,
                startTime: {
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
            const duration = session.durationMinutes || 0;

            // Get date (without time) for counting unique play days
            const playDate = session.startTime.toISOString().split('T')[0];

            if (!gameStatsMap[gameId]) {
                gameStatsMap[gameId] = {
                    name: gameName,
                    totalPlayTime: 0,
                    playDates: new Set()
                };
            }

            gameStatsMap[gameId].totalPlayTime += duration;
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

        console.info(`${repo}[GamingSessionRepository]${reset} Game stats: `, stats);
        return stats;

    } catch (error) {
        console.error(`${repo}[GamingSessionRepository]${err} ${error}${reset}`);
        return [];
    }
}

module.exports = {GamingSessionRepository};