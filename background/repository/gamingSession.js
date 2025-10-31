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
    endGamingSession: async (id, durationMinutes) => {return {}}
};

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

GamingSessionRepository.endGamingSession = async (gsid, finalDurationMinutes) => {
    try {
        res = await getPrisma().gamingSession.update({
            where: {
                id: gsid,
                userId: UserRepository.getCurrentUser().id,
                endTime: {equals: getPrisma().gamingSession.fields.startTime}
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