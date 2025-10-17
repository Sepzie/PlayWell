const { getPrisma } = require('../prismaClient.js');
const { debug_colors } = require('../../src/theme/colors.js');
const {repo, reset} = debug_colors;

const UserRepository = {
    tmp: async () => {
        res = await getPrisma().user.findMany();
        console.info(`${repo}[UserRepository]${reset} Users: `, res);
    }
}

module.exports = {UserRepository}