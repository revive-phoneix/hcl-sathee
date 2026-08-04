const assert = require('assert');
const {
  resolvePercentage,
  resolveAttendancePercentages,
} = require('../src/Models/MitraAttendance');

const cases = [
  [75, 75],
  [null, 100],
  ['150', 100],
  ['88', 88],
];

for (const [provided, expected] of cases) {
  const actual = resolvePercentage(provided, 100);
  assert.strictEqual(actual, expected, `expected ${expected} for ${provided}`);
}

const percentages = resolveAttendancePercentages(
  {
    dailyAttendancePercentage: 82,
  },
  {
    dailyAttendancePercentage: 100,
    weeklyAttendancePercentage: 90,
    monthlyAttendancePercentage: 85,
  }
);

assert.strictEqual(percentages.dailyAttendancePercentage, 82);
assert.strictEqual(percentages.weeklyAttendancePercentage, 90);
assert.strictEqual(percentages.monthlyAttendancePercentage, 85);

console.log('mitra attendance percentage tests passed');
