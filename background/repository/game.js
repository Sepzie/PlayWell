const { getPrisma } = require('../prismaClient.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const GameRepository = {
    getAllGames: async () => {return []},
    getGameByName: async (gname) => {return {}},
    createGame: async (game) => {return {}},
    upsertGame: async (game) => {return {}},
};

GameRepository.getAllGames = async () => {
    try {
        res = await getPrisma().game.findMany();
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return [];
    }
    // console.info(`${repo}[GameRepository]${reset} All games: `, res);
    return res;
}

GameRepository.getGameByName = async (gname) => {
    try {
        res = await getPrisma().game.findUnique({
            where: {
                nadme: gname
            }
        })
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    // console.info(`${repo}[GameRepository]${reset} Found game: `, res);
    return res;
}

module.exports = {GameRepository}