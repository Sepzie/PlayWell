const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const GameRepository = {
    getAllGames: async () => {return []},
    getGameByName: async (gname) => {return {}},

    // FUNCTIONS UNDER HERE REQUIRE A USER TO BE LOADED. See UserRepository.loadNewOrReturningUser
    createGame: async (name, location, platform, genre) => {return {}},
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

GameRepository.createGame = async (name, location, platform, genre) => {
    try {
        res = await getPrisma().game.create({
            data: {
                name: name,
                location: location,
                platform: platform,
                category: genre,
                userId: UserRepository.getCurrentUser().id
            }
        });
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return;
    }
    u = res;
    console.info(`${repo}[GameRepository]${reset} Created new game: `, res);
    return;
}

module.exports = {GameRepository}