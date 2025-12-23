const { LimitsService } = require('../background/services/limitsService')

jest.mock('../background/repository/limit.js', () => ({
  LimitRepository: ({
    getUserLimits: jest.fn().mockImplementation(arg => (["Limit1", "Limit2", "Limit3"])),
    setLimit: jest.fn().mockImplementation((arg1, arg2, arg3) => ({ "limit": "value" })),
    deleteLimit: jest.fn().mockImplementation((arg1, arg2) => ("Deleted!")),
    getLimitForDay: jest.fn().mockImplementation((arg1, arg2) => ({ "limit": "value" })),
  })
}));

test("getUserLimits normal case", () => {
  expect(LimitsService.getUserLimits(1)).resolves.toStrictEqual(["Limit1", "Limit2", "Limit3"]);
});

test("setLimit normal case", () => {
  expect(LimitsService.setLimit(1, "MONDAY", 30)).resolves.toStrictEqual({ "limit": "value" });
});

test("deleteLimit normal case", () => {
  expect(LimitsService.deleteLimit(1, "SUNDAY")).resolves.toStrictEqual("Deleted!");
});

test("getTodayLimit normal case", () => {
  expect(LimitsService.setLimit(1)).resolves.toStrictEqual({ "limit": "value" });
});