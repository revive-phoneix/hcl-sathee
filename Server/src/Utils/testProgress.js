const Test = require("../Models/Test");
const TestSubjectMark = require("../Models/TestSubjectMark");

const average = (values) => {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const round1 = (n) => Math.round(n * 10) / 10;

// Level 2: one student's overall % for a given test (average across THEIR subjects)
const computeStudentTestPercentage = (marksForStudent) => {
  const pcts = marksForStudent
    .map((m) => m.subjectPercentage)
    .filter((p) => p != null);
  return pcts.length ? average(pcts) : null;
};

// Level 3: course % for that test = average of student percentages
const computeCourseTestPercentage = (studentPercentages) => {
  const valid = studentPercentages.filter((p) => p != null);
  return valid.length ? average(valid) : null;
};

const groupBy = (rows, key) => {
  const map = new Map();
  for (const row of rows) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
};

/**
 * Builds the course progress timeline: Start (0%) -> Test 1 -> Test 2 -> ...
 * with percentage delta (increase/decrease) between consecutive points.
 */
const buildCourseProgressTimeline = async (course, centre = null) => {
  const tests = await Test.findByCourse(course, centre); // already sorted by testNumber

  const timeline = [
    { testId: null, testName: "Start", testDate: null, coursePercentage: 0, delta: 0, direction: "flat" },
  ];

  let previous = 0;
  for (const test of tests) {
    const marks = await TestSubjectMark.findByTest(test.id);
    const byStudent = groupBy(marks, "studentId");
    const studentPercentages = [...byStudent.values()].map(computeStudentTestPercentage);
    const coursePctRaw = computeCourseTestPercentage(studentPercentages);
    const coursePct = coursePctRaw == null ? previous : round1(coursePctRaw);
    const delta = round1(coursePct - previous);

    timeline.push({
      testId: test.id,
      testName: test.name,
      testDate: test.testDate,
      coursePercentage: coursePct,
      delta,
      direction: delta > 0 ? "increase" : delta < 0 ? "decrease" : "flat",
      studentsGraded: studentPercentages.filter((p) => p != null).length,
    });
    previous = coursePct;
  }

  return timeline;
};

module.exports = {
  computeStudentTestPercentage,
  computeCourseTestPercentage,
  buildCourseProgressTimeline,
};