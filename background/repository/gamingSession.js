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
    endGamingSession: async (gsid, durationMinutes) => {return {}}
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

module.exports = {GamingSessionRepository};