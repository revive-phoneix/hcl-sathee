const Student = require("../Models/Student");
const SubjectPerformance = require("../Models/SubjectPerformance");
const SubjectAttendance = require("../Models/SubjectAttendance");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");

const groupByStudentId = (rows) => {
  const map = new Map();
  for (const row of rows) {
    const key = row.studentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
};

const requireStudent = async (res, studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    fail(res, 404, "Student not found");
    return null;
  }
  return student;
};

exports.getStudentsWithPerformance = wrap(
  async (req, res) => {
    const students = filterByUserCentre(await Student.findAll(), req.user);
    const [performances, attendances] = await Promise.all([
      SubjectPerformance.findAll(),
      SubjectAttendance.findAll(),
    ]);

    const performancesByStudent = groupByStudentId(performances);
    const attendancesByStudent = groupByStudentId(attendances);

    return ok(res, {
      students: students.map((student) => ({
        ...student,
        performances: performancesByStudent.get(student.id) || [],
        attendances: attendancesByStudent.get(student.id) || [],
      })),
    });
  },
  { label: "Get Students with Performance Error", message: "Failed to fetch performance details" }
);

exports.addSubjectPerformance = wrap(
  async (req, res) => {
    const { studentId, subject, marks, maxMarks, grade, remarks } = req.body;

    if (!studentId || !subject || marks === undefined) {
      return fail(res, 400, "Student ID, subject, and marks are required");
    }

    const student = await requireStudent(res, studentId);
    if (!student) return;

    const performance = await SubjectPerformance.create({
      studentId: student.id,
      subject,
      marks,
      maxMarks: maxMarks || 100,
      grade: grade || null,
      remarks: remarks || null,
    });

    return ok(res, 201, { performance });
  },
  { label: "Add Subject Performance Error", message: "Failed to add performance record" }
);

exports.addSubjectAttendance = wrap(
  async (req, res) => {
    const {
      studentId,
      subject,
      dailyAttendancePercentage,
      weeklyAttendancePercentage,
      monthlyAttendancePercentage,
      attendancePercentage,
      totalClasses,
      classesAttended,
    } = req.body;

    if (!studentId || !subject) {
      return fail(res, 400, "Student ID and subject are required");
    }

    const student = await requireStudent(res, studentId);
    if (!student) return;

    const daily = dailyAttendancePercentage ?? attendancePercentage ?? 0;
    const weekly = weeklyAttendancePercentage ?? attendancePercentage ?? 0;
    const monthly = monthlyAttendancePercentage ?? attendancePercentage ?? 0;

    const attendance = await SubjectAttendance.create({
      studentId: student.id,
      subject,
      dailyAttendancePercentage: daily,
      weeklyAttendancePercentage: weekly,
      monthlyAttendancePercentage: monthly,
      totalClasses: totalClasses || 0,
      classesAttended: classesAttended || 0,
    });

    return ok(res, 201, { attendance });
  },
  { label: "Add Subject Attendance Error", message: "Failed to add attendance record" }
);
