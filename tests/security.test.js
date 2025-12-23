const { GameRepository } = require('../background/repository/game.js');

const MockGame = {
  findMany: () => {
    return { "field": 1 }
  },
  findUnique: (arg) => {
    return { "id": 1 }
  },
  findFirst: (arg) => {
    return { "id": 12 }
  }
}

const MockPrisma = {
  game: MockGame
}

jest.mock('../background/prismaClient.js', () => ({
  getPrisma: jest.fn().mockImplementation(() => (MockPrisma))
}));

test("getAllGames normal case", () => {
  expect(GameRepository.getAllGames()).resolves.toStrictEqual(MockGame.findMany());
});

test("getGameById normal case", () => {
  expect(GameRepository.getGameById(1)).resolves.toStrictEqual(MockGame.findUnique(1));
});

test("getGameById SQL injection", () => {
  expect(GameRepository.getGameById("=1 or SELECT * FROM Game;")).resolves.toStrictEqual(MockGame.findUnique(2));
});

test("getGameByName normal case", () => {
  expect(GameRepository.getGameByName("Minecraft")).resolves.toStrictEqual(MockGame.findUnique("Minecraft"));
});

test("getGameByName SQL injection", () => {
  expect(GameRepository.getGameByName("=1 or SELECT * FROM Game;")).resolves.toStrictEqual(MockGame.findUnique("Name"));
});

test("getGameByLocation normal case", () => {
  expect(GameRepository.getGameByLocation("C://steamapps/common/")).resolves.toStrictEqual(MockGame.findFirst("Minecraft"));
});

test("getGameByLocation SQL injection", () => {
  expect(GameRepository.getGameByLocation("=1 or SELECT * FROM Game;")).resolves.toStrictEqual(MockGame.findFirst("Name"));
});