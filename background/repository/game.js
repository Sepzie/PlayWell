const { getPrisma } = require('../prismaClient.js');
const { UserRepository } = require('./user.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

const GameRepository = {
    getAllGames: async () => {return []},
    getEnabledGames: async () => {return []},
    getGameById: async (gid) => {return {}},
    getGameByName: async (gname) => {return {}},
    getGameByLocation: async (location) => {return {}},
    deleteGame: async (gid) => {return {}},
    deleteGames: async (gnames) => {return {}},
    deleteAllGames: async () => {return {}},
    enableGame: async (gid) => {return {}},
    disableGame: async (gid) => {return {}},
    updateGameLocation: async (gid, location) => {return {}},

    // FUNCTIONS UNDER HERE REQUIRE A USER TO BE LOADED. See UserRepository.loadNewOrReturningUser
    createGame: async (name, location, platform) => {return {}},
    upsertGame: async (name, location, platform) => {return {}}
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
    return res;
}

/**
 * Returns all enabled Games in the database.
 *
 * @returns a JSON array
 */
GameRepository.getEnabledGames = async () => {
    try {
        res = await getPrisma().game.findMany({
            where: {
                enabled: true
            }
        });
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return [];
    }
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
    return res;
}

/**
 * Returns the Game with the given executable location.
 *
 * @param {String} location executable path
 * @returns a JSON object or null
 */
GameRepository.getGameByLocation = async (location) => {
    try {
        res = await getPrisma().game.findFirst({
            where: {
                location: location
            }
        })
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return null;
    }
    return res;
}

/**
 * Creates a Game in the database, or throws an error if there is already a Game in db with the given name.
 * A User must be loaded in. See: UserRepository.loadNewOrReturningUser
 * 
 * @param {String} name unique name of the game
 * @param {String} location the executable path of the game
 * @param {String} platform game platform
 * @returns 
 */
GameRepository.createGame = async (name, location, platform) => {
    try {
        res = await getPrisma().game.create({
            data: {
                name: name,
                location: location,
                platform: platform,
                userId: UserRepository.getCurrentUser().id
            }
        });
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    u = res;
    console.info(`${repo}[GameRepository]${reset} Created game: ${res.name}`);
    return res;
}

/**
 * Deletes a single game by ID.
 * 
 * @param {String} gid the game ID
 * @returns a JSON object of the deleted game
 */
GameRepository.deleteGame = async (gid) => {
    try {
        res = await getPrisma().game.delete({
            where: {
                id: gid
            }
        })
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    console.info(`${repo}[GameRepository]${reset} Deleted game: ${res.name}`);
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
    console.info(`${repo}[GameRepository]${reset} Deleted ${res.count} game(s)`);
    return res;
}

/**
 * Updates the location or platform of a Game in db, or creates a new one with the given fields if not yet in db.
 * A User must be loaded in. See: UserRepository.loadNewOrReturningUser
 * 
 * @param {String} name a unique name (this cannot be updated through this method)
 * @param {String} location the executable path of the game
 * @param {String} platform game platform
 * @returns nothing on error, or a JSON Array of the upserted games
 */
GameRepository.upsertGame = async (name, location, platform) => {
    let data = {
        location: location,
        platform: platform,
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
    console.info(`${repo}[GameRepository]${reset} Deleted ${res.count} game(s)`);
    return res;
}

/**
 * Enables a game for tracking.
 * 
 * @param {String} gid the game ID
 * @returns the updated game object
 */
GameRepository.enableGame = async (gid) => {
    try {
        res = await getPrisma().game.update({
            where: { id: gid },
            data: { enabled: true }
        });
        console.info(`${repo}[GameRepository]${reset} Enabled game: ${res.name}`);
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    return res;
}

/**
 * Disables a game from tracking.
 * 
 * @param {String} gid the game ID
 * @returns the updated game object
 */
GameRepository.disableGame = async (gid) => {
    try {
        res = await getPrisma().game.update({
            where: { id: gid },
            data: { enabled: false }
        });
        console.info(`${repo}[GameRepository]${reset} Disabled game: ${res.name}`);
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    return res;
}

/**
 * Updates the location path of a game.
 * Useful when an app moves to a new versioned subdirectory.
 * 
 * @param {String} gid the game ID
 * @param {String} location the new executable path
 * @returns the updated game object
 */
GameRepository.updateGameLocation = async (gid, location) => {
    try {
        res = await getPrisma().game.update({
            where: { id: gid },
            data: { location: location }
        });
        console.info(`${repo}[GameRepository]${reset} Updated game location: ${res.name} -> ${location}`);
    } catch (error) {
        console.error(`${repo}[GameRepository]${err} ${error}${reset}`);
        return {};
    }
    return res;
}

module.exports = {GameRepository}