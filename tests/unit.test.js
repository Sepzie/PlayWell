// const { formatMinutesToHoursMinutes, formatMinutesToDecimalHours } = require('../src/utils/timeFormatter.js');
// import { formatMinutesToHoursMinutes, formatMinutesToDecimalHours } from '../src/utils/timeFormatter';

// test("formatMinutesToDecimalHours given null returns 0", () => {
//   expect(formatMinutesToDecimalHours(null)).toBe('0 Hours');
// });

// test("formatMinutesToDecimalHours given undefined returns 0", () => {
//   expect(formatMinutesToDecimalHours(undefined)).toBe('0 Hours');
// });

// test("formatMinutesToDecimalHours given negative returns 0", () => {
//   expect(formatMinutesToDecimalHours(-1)).toBe('0 Hours');
// });

// test("formatMinutesToDecimalHours given 0 returns 0.0", () => {
//   expect(formatMinutesToDecimalHours(0)).toBe('0.0 Hours');
// });

// test("formatMinutesToDecimalHours normal case", () => {
//   expect(formatMinutesToDecimalHours(60)).toBe('1.0 Hours');
// });

// test("formatMinutesToHoursMinutes given null returns default", () => {
//   expect(formatMinutesToHoursMinutes(null)).toBe('0h 0m');
// });

// test("formatMinutesToHoursMinutes given undefined returns default", () => {
//   expect(formatMinutesToHoursMinutes(undefined)).toBe('0h 0m');
// });

// test("formatMinutesToHoursMinutes given 0 returns default", () => {
//   expect(formatMinutesToHoursMinutes(0)).toBe('0h 0m');
// });

// test("formatMinutesToHoursMinutes given negative returns default", () => {
//   expect(formatMinutesToHoursMinutes(-10)).toBe('0h 0m');
// });

// test("formatMinutesToHoursMinutes normal case", () => {
//   expect(formatMinutesToHoursMinutes(90)).toBe('1h 30m');
// });