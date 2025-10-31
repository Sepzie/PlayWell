const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const GamingSessionRepository = {
    // FUNCTIONS UNDER HERE REQUIRE A USER TO BE LOADED. See UserRepository.loadNewOrReturningUser
    getAllGamingSessions: async () => {return []},
    deleteAllGamingSessions: async () => {return []},

    getGamingSessionById: async () => {return {}},
    
    startGamingSession: async (gameId, startingDurationMinutes) => {return {}},
    endGamingSession: async (id, durationMinutes) => {return {}}
};

GamingSessionRepository.startGamingSession = async (gameId, startingDurationMinutes) => {
    return [];
}

GamingSessionRepository.endGamingSession = async (id, durationMinutes) => {
    return [];
}

module.exports = {GamingSessionRepository};