const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const GameRepository = {
    getAllGames: async () => {return []},
    getGameById: async (gid) => {return {}},
    getGameByName: async (gname) => {return {}},
    deleteGames: async (gnames) => {return {}},
    deleteAllGames: async () => {return {}},

    // FUNCTIONS UNDER HERE REQUIRE A USER TO BE LOADED. See UserRepository.loadNewOrReturningUser
    createGame: async (name, location, platform, genre) => {return {}},
    upsertGame: async (name, location, platform, genre) => {return {}}
};

/**
 * Returns all Games in the database.
 *
 * @returns a JSON array
 */
GameRepository.getAllGames = async () => {
    try {
        res = await getPrisma().game.findMany();
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return [];
    }
    console.info(`${repo}[GameRepository]${reset} All games: `, res);
    return res;
}

/**
 * Returns the Game with the given gid.
 *
 * @param {String} gid unique game id
 * @returns a JSON object
 */
GameRepository.getGameById = async (gid) => {
    try {
        res = await getPrisma().game.findUnique({
            where: {
                id: gid
            }
        })
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    console.info(`${repo}[GameRepository]${reset} Found game: `, res);
    return res;
}

/**
 * Returns the Game with the given gname.
 *
 * @param {String} gname unique name
 * @returns a JSON object
 */
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
    console.info(`${repo}[GameRepository]${reset} Found game: `, res);
    return res;
}

/**
 * Creates a Game in the database, or throws an error if there is already a Game in db with the given name.
 * A User must be loaded in. See: UserRepository.loadNewOrReturningUser
 * 
 * @param {String} name unique name of the game
 * @param {String} location the executable path of the game
 * @param {String} platform game platform (only for compatibility, for now)
 * @param {Genre} genre one of the values in the Genre enum (only for compatibility, for now)
 * @returns 
 */
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

/**
 * Deletes any game that matches names given in gnames.
 * 
 * @param {Array} gnames an array of unique name strings
 * @returns a JSON object containing the number of deleted objects (in the count field)
 */
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

/**
 * Updates the location, platform, or genre of a Game in db, or creates a new one with the given fields if not yet in db.
 * A User must be loaded in. See: UserRepository.loadNewOrReturningUser
 * 
 * @param {String} name a unique name (this cannot be updated through this method)
 * @param {String} location the executable path of the game
 * @param {String} platform game platform (only for compatibility, for now)
 * @param {Genre} genre one of the values in the Genre enum (only for compatibility, for now)
 * @returns nothing on error, or a JSON Array of the upserted games
 */
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
    // console.info(`${repo}[GameRepository]${reset} Upserted game: `, res);
    return res;
}

/**
 * Deletes ALL games in the database.
 * 
 * @returns a JSON object containing the number of deleted objects (in the count field)
 */
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