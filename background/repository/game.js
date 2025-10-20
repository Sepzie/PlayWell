const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const GameRepository = {
    getAllGames: async () => {return []},
    getGameByName: async (gname) => {return {}},
    deleteGames: async (gnames) => {return {}},
    deleteAllGames: async () => {return {}},

    // FUNCTIONS UNDER HERE REQUIRE A USER TO BE LOADED. See UserRepository.loadNewOrReturningUser
    createGame: async (name, location, platform, genre) => {return {}},
    upsertGame: async (gname, game) => {return {}}
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
                name: gname
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
        return {};
    }
    u = res;
    console.info(`${repo}[GameRepository]${reset} Created new game: `, res);
    return res;
}

GameRepository.deleteGames = async (gnames) => {
    try {
        res = await getPrisma().game.deleteMany({
            where: {
                name: {in: gnames}
            }
        })
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    console.info(`${repo}[GameRepository]${reset} Deleted games: `, res);
    return res;
}

GameRepository.upsertGame = async (name, location, platform, genre) => {
    let data = {
        location: location,
        platform: platform,
        category: genre,
    }
    try {
        res = await getPrisma().game.upsert({
            where: {name: name},
            update: data,
            create: {
                name: name,
                userId: UserRepository.getCurrentUser().id,
                ...data},
        })
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    console.info(`${repo}[GameRepository]${reset} Upserted game: `, res);
    return res;
}

GameRepository.deleteAllGames = async () => {
    try {
        res = await getPrisma().game.deleteMany({})
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    console.info(`${repo}[GameRepository]${reset} Deleted games: `, res);
    return res;
}

module.exports = {GameRepository}