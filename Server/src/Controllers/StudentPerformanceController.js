const Student = require("../Models/Student");
const SubjectPerformance = require("../Models/SubjectPerformance");
const SubjectAttendance = require("../Models/SubjectAttendance");
const DailySubjectAttendance = require("../Models/DailySubjectAttendance");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  filterByUserCentre,
  isAdminRole,
  matchesCentre,
} = require("../Utils/centreMatch");
const { toDateOnly } = require("../Utils/firestoreHelpers");
const { recomputeSubjectAttendance } = require("../Utils/recomputeSubjectAttendance");

const groupByStudentId = (rows) => {
  const map = new Map();
  for (const row of rows) {
    const key = row.studentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
};

const subjectPct = (row) => {
  if (!row) return 0;
  if (row.percentage != null && Number.isFinite(Number(row.percentage))) {
    return Number(row.percentage);
  }
  if (row.totalClasses > 0) {
    return Math.round((Number(row.classesAttended || 0) / row.totalClasses) * 1000) / 10;
  }
  return (
    Number(row.monthlyAttendancePercentage ?? row.weeklyAttendancePercentage ?? row.dailyAttendancePercentage ?? 0) ||
    0
  );
};

const enrichWithSubjectMaps = (student, performances = [], attendances = []) => {
  const subjects =
    Array.isArray(student.subjects) && student.subjects.length
      ? student.subjects
      : [
          ...new Set([
            ...Object.keys(student.marks || {}),
            ...Object.keys(student.attendance || {}),
            ...performances.map((row) => row.subject),
            ...attendances.map((row) => row.subject),
          ]),
        ].filter(Boolean);

  const marks = { ...(student.marks || {}) };
  const attendance = { ...(student.attendance || {}) };

  for (const subject of subjects) {
    if (marks[subject] === undefined) marks[subject] = 0;
    if (attendance[subject] === undefined) attendance[subject] = 0;
  }

  for (const perf of performances) {
    marks[perf.subject] = Number(perf.marks) || 0;
  }
  for (const att of attendances) {
    attendance[att.subject] = subjectPct(att);
  }

  return {
    ...student,
    subjects,
    marks,
    attendance,
    performances,
    attendances,
  };
};

const requireStudent = async (res, studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    fail(res, 404, "Student not found");
    return null;
  }
  return student;
};

const assertCentreAccess = (req, centre) => {
  if (isAdminRole(req.user?.role)) return true;
  if (!req.user?.centre) return false;
  return matchesCentre(centre, req.user.centre);
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
      students: students.map((student) =>
        enrichWithSubjectMaps(
          student,
          performancesByStudent.get(student.id) || [],
          attendancesByStudent.get(student.id) || []
        )
      ),
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

    // Prefer upsert so we don't create duplicate subject rows for the same pair
    const attendance = await SubjectAttendance.upsertTotals({
      studentId: student.id,
      subject,
      totalClasses: totalClasses || 0,
      classesAttended: classesAttended || 0,
      percentage:
        attendancePercentage ??
        monthlyAttendancePercentage ??
        weeklyAttendancePercentage ??
        dailyAttendancePercentage ??
        undefined,
    });

    // Preserve explicit period overrides when provided without totals-driven recompute
    if (
      dailyAttendancePercentage != null ||
      weeklyAttendancePercentage != null ||
      monthlyAttendancePercentage != null
    ) {
      const found = await SubjectAttendance.findByStudentAndSubject(
        student.id,
        subject
      );
      if (found) {
        await found.ref.update({
          dailyAttendancePercentage: daily,
          weeklyAttendancePercentage: weekly,
          monthlyAttendancePercentage: monthly,
          updated_at: new Date(),
        });
        const doc = await found.ref.get();
        return ok(res, 201, {
          attendance: {
            id: Number(doc.id) || doc.id,
            ...doc.data(),
          },
        });
      }
    }

    return ok(res, 201, { attendance });
  },
  { label: "Add Subject Attendance Error", message: "Failed to add attendance record" }
);

/**
 * GET /api/students/performance/daily-attendance
 * ?date=YYYY-MM-DD&subject=Physics&time=09:00-10:00&centre=...
 */
exports.getDailySubjectAttendance = wrap(
  async (req, res) => {
    const date = toDateOnly(req.query.date);
    const subject = String(req.query.subject || "").trim();
    const time = String(req.query.time || "").trim();
    const centreQuery = String(req.query.centre || "").trim() || null;

    if (!date || !subject) {
      return fail(res, 400, "date (YYYY-MM-DD) and subject are required");
    }

    const centreFilter = isAdminRole(req.user?.role)
      ? centreQuery
      : req.user?.centre || null;

    if (!isAdminRole(req.user?.role) && !centreFilter) {
      return fail(res, 403, "Centre is required for this role");
    }

    const records = await DailySubjectAttendance.findByDateSubjectTime({
      date,
      subject,
      time,
      centre: centreFilter,
    });

    return ok(res, { records, date, subject, time });
  },
  {
    label: "Get Daily Subject Attendance Error",
    message: "Failed to fetch daily subject attendance",
  }
);

/**
 * POST /api/students/performance/daily-attendance
 * Body: { date, subject, time?, course?, centre?, records: [{ studentId, status, name? }] }
 */
exports.saveDailySubjectAttendance = wrap(
  async (req, res) => {
    const {
      date,
      subject,
      time = "",
      course = null,
      centre = null,
      records,
    } = req.body || {};

    const dateOnly = toDateOnly(date);
    const subjectName = String(subject || "").trim();
    const timeKey = String(time || "").trim();

    if (!dateOnly || !subjectName) {
      return fail(res, 400, "date and subject are required");
    }
    if (!Array.isArray(records) || records.length === 0) {
      return fail(res, 400, "records array is required");
    }

    const saved = [];
    const errors = [];
    const touchedPairs = new Map();

    for (const row of records) {
      const studentId = row?.studentId;
      if (studentId == null || studentId === "") {
        errors.push({ studentId, message: "studentId is required" });
        continue;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        errors.push({ studentId, message: "Student not found" });
        continue;
      }

      if (!assertCentreAccess(req, student.centre)) {
        errors.push({ studentId, message: "Centre access denied for this student" });
        continue;
      }

      const enrolled =
        Array.isArray(student.subjects) && student.subjects.length
          ? student.subjects.map((s) => String(s).trim().toLowerCase())
          : Object.keys(student.attendance || {}).map((s) => s.toLowerCase());

      if (
        enrolled.length > 0 &&
        !enrolled.includes(subjectName.toLowerCase())
      ) {
        errors.push({
          studentId,
          message: `Student is not enrolled in subject ${subjectName}`,
        });
        continue;
      }

      try {
        const log = await DailySubjectAttendance.upsert({
          studentId: student.id,
          name: row.name || student.name,
          centre: centre || student.centre,
          course: course || student.course,
          subject: subjectName,
          date: dateOnly,
          time: timeKey,
          status: row.status,
        });
        saved.push(log);
        touchedPairs.set(`${student.id}::${subjectName}`, {
          studentId: student.id,
          subject: subjectName,
        });
      } catch (error) {
        errors.push({
          studentId,
          message: error.message || "Failed to save attendance",
        });
      }
    }

    const aggregates = [];
    for (const pair of touchedPairs.values()) {
      aggregates.push(await recomputeSubjectAttendance(pair.studentId, pair.subject));
    }

    return ok(res, {
      message: "Daily subject attendance saved",
      date: dateOnly,
      subject: subjectName,
      time: timeKey,
      savedCount: saved.length,
      records: saved,
      aggregates,
      errors,
    });
  },
  {
    label: "Save Daily Subject Attendance Error",
    message: "Failed to save daily subject attendance",
    useErrorMessage: true,
  }
);
