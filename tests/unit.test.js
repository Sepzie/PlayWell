const { UserRepository } = require('../background/repository/user.js');

const MockGame = {
  findMany: () => {
    return { "field": 1 }
  },
  findUnique: (arg) => {
    return { "id": 1 }
  },
  findFirst: (arg) => {
    return { "id": 12 }
  },
  create: (arg) => {
    return { "id": 12 }
  }
}

const MockPrisma = {
  user: MockGame
}

jest.mock('../background/prismaClient.js', () => ({
  getPrisma: jest.fn().mockImplementation(() => (MockPrisma))
}));

test("getAllUsers normal case", () => {
  expect(UserRepository.getAllUsers()).resolves.toStrictEqual(MockGame.findMany());
});

test("loadNewOrReturningUser normal case", () => {
  expect(UserRepository.loadNewOrReturningUser()).resolves.toStrictEqual(undefined);
});