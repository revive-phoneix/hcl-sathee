const DailySubjectAttendance = require("../Models/DailySubjectAttendance");
const SubjectAttendance = require("../Models/SubjectAttendance");

const recomputeSubjectAttendance = async (studentId, subject) => {
  const logs = await DailySubjectAttendance.findByStudentAndSubject(studentId, subject);
  const totalClasses = logs.length;
  const classesAttended = logs.filter((row) => row.status === "present").length;
  return SubjectAttendance.upsertTotals({
    studentId,
    subject,
    totalClasses,
    classesAttended,
    percentage: SubjectAttendance.roundPct(classesAttended, totalClasses),
  });
};

module.exports = { recomputeSubjectAttendance };
