const DailySubjectAttendance = require("../Models/DailySubjectAttendance");
const SubjectAttendance = require("../Models/SubjectAttendance");

/**
 * Rebuild subjectAttendances totals from all dailySubjectAttendances for that pair.
 * Safe to call after every class save (idempotent).
 */
const recomputeSubjectAttendance = async (studentId, subject) => {
  const logs = await DailySubjectAttendance.findByStudentAndSubject(
    studentId,
    subject
  );
  const totalClasses = logs.length;
  const classesAttended = logs.filter((row) => row.status === "present").length;
  const percentage = SubjectAttendance.roundPct(classesAttended, totalClasses);

  return SubjectAttendance.upsertTotals({
    studentId,
    subject,
    totalClasses,
    classesAttended,
    percentage,
  });
};

module.exports = { recomputeSubjectAttendance };
