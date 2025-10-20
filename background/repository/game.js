const { getPrisma } = require('../prismaClient.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const GameRepository = {
    getAllGames: async () => {return []},
    getGameByName: async (name) => {return {}},
    createGame: async (game) => {return {}},
    upsertGame: async (game) => {return {}},
};

module.exports = {GameRepository}