const assert = require('node:assert');
const TZ_OFFSET_MAP = require('../src/timezones.js');
const utils = require('../src/utils.js');

global.TZ_OFFSET_MAP = TZ_OFFSET_MAP;

const {
  parseTimeZoneOffset,
  parseDateTimeString,
  findDateStringInText,
  cleanupText,
  pad,
  formatForTimeZone
} = utils;

function expectDate(value, expectedISOString) {
  const parsed = parseDateTimeString(value);
  assert.ok(parsed instanceof Date && !Number.isNaN(parsed.getTime()), `Expected ${value} to parse`);
  assert.strictEqual(parsed.toISOString(), expectedISOString);
}

function run() {
  assert.strictEqual(cleanupText('  March   31,   2026  '), 'March 31, 2026');
  assert.strictEqual(cleanupText('Mar\n31\t2026'), 'Mar 31 2026');
  assert.strictEqual(pad(3), '03');
  assert.strictEqual(pad(12), '12');

  assert.strictEqual(parseTimeZoneOffset('GMT+8'), '+08:00');
  assert.strictEqual(parseTimeZoneOffset('GMT+08:00'), '+08:00');
  assert.strictEqual(parseTimeZoneOffset('UTC-5'), '-05:00');
  assert.strictEqual(parseTimeZoneOffset('UTC+10'), '+10:00');
  assert.strictEqual(parseTimeZoneOffset('UTC-0530'), '-05:30');
  assert.strictEqual(parseTimeZoneOffset('GMT-2:30'), '-02:30');
  assert.strictEqual(parseTimeZoneOffset('+0530'), '+05:30');
  assert.strictEqual(parseTimeZoneOffset('EST'), '-05:00');
  assert.strictEqual(parseTimeZoneOffset('HKT'), '+08:00');
  assert.strictEqual(parseTimeZoneOffset('INVALID'), null);

  assert.strictEqual(
    findDateStringInText('Event: March 31, 2026 10:34 AM GMT+8, join now'),
    'March 31, 2026 10:34 AM GMT+8'
  );

  assert.strictEqual(
    findDateStringInText('Deadline: Mar 31 10:34AM EDT.'),
    'Mar 31 10:34AM EDT'
  );

  assert.strictEqual(
    findDateStringInText('Start: March 31,2026 10:34AM GMT+8'),
    'March 31,2026 10:34AM GMT+8'
  );

  assert.strictEqual(
    findDateStringInText('ISO time: 2026-03-31 10:34 -05:00'),
    '2026-03-31 10:34 -05:00'
  );

  expectDate('March 31, 2026 10:34 AM GMT+8', '2026-03-31T02:34:00.000Z');
  expectDate('March 31, 2026 7:00am EDT', '2026-03-31T11:00:00.000Z');
  expectDate('Mar 31 10:34AM EST', '2026-03-31T15:34:00.000Z');
  expectDate('March 31,2026 10:34AM GMT+8', '2026-03-31T02:34:00.000Z');
  expectDate('2026-03-31 10:34 +05:30', '2026-03-31T05:04:00.000Z');

  assert.strictEqual(parseDateTimeString('not a date'), null);
  assert.strictEqual(parseDateTimeString('March 31 10:34 AM BADTZ'), null);
  assert.strictEqual(parseDateTimeString('March 31, 2026 10:34 AM'), null);

  const utcString = formatForTimeZone(new Date(Date.UTC(2026, 2, 31, 2, 34)), 'UTC');
  assert.strictEqual(typeof utcString, 'string');
  assert.ok(utcString.includes('UTC'), `Expected UTC in formatted string, got ${utcString}`);

  assert.strictEqual(formatForTimeZone(new Date(), 'Invalid/Zone'), null);

  console.log('All utils tests passed.');
}

run();
