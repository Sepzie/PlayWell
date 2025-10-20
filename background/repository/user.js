const { getPrisma } = require('../prismaClient.js');
const { debug_colors } = require('../../src/theme/colors.js');
const { repo, reset, err } = debug_colors;

let u;

const UserRepository = {
    /**
     * Returns all Users in the database.
     * 
     * @returns list of Users in this JSON format "[ {id: int, username: string}, ... ]"
     */
    getAllUsers: async () => {
        try {
            res = await getPrisma().user.findMany();
        } catch (error) {
            console.error(`${repo}[UserRepository]${err} ${error}${reset}`);
            return null;
        }
        console.info(`${repo}[UserRepository]${reset} All users: `, res);
        return res;
    },
    /**
     * Returns the currently loaded User, or null if no User has been loaded using loadNewOrReturningUser.
     * 
     * @returns null or the currently loaded User JSON object formatted as "{id: int, username: string}"
     */
    getCurrentUser: () => {
        return u;
    },
    /**
     * Loads a User for any subsequent calls to this repository.
     * This is necessary because we enforce only 1 user to be referenced by the app at a given time. 
     * 
     * @param {String} uname The user's username in database 
     * @returns null
     */
    loadNewOrReturningUser: async (uname) => {
        try {
            res = await getPrisma().user.findUnique({
                where: {username: uname}
            })
        } catch (error) {
            console.error(`${repo}[UserRepository]${err} ${error}${reset}`);
            return;
        }
        
        // Return res if User is found
        if (res) {
            console.info(`${repo}[UserRepository]${reset} Found user: `, res);
            u = res;
            return;
        }

        // Else, create the User
        try {
            res = await getPrisma().user.create({
                data: {username: uname}
            });
        } catch (error) {
            console.error(`${repo}[UserRepository]${err} ${error}${reset}`);
            return;
        }
        u = res;
        console.info(`${repo}[UserRepository]${reset} Created new user: `, res);
        return;
    },

    // FUNCTIONS UNDER HERE REQUIRES A USER TO BE LOADED

    /**
     * Unloads the current User if there is a User that is currently loaded.
     * 
     * @returns null or the unloaded User JSON object formatted as "{id: int, username: string}"
     */
    unloadUser: () => {
        if (!u) {
            return null;
        }

        tmp = u;
        u = null;
        console.info(`${repo}[UserRepository]${reset} Unloaded user`, tmp);
        return tmp;
    }
}

module.exports = {UserRepository}