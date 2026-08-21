const path = require("path");
const Student = require("../Models/Student");
const SubjectPerformance = require("../Models/SubjectPerformance");
const SubjectAttendance = require("../Models/SubjectAttendance");
const DailySubjectAttendance = require("../Models/DailySubjectAttendance");
const TestSubjectMark = require("../Models/TestSubjectMark");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  filterByUserCentre,
  isAdminRole,
  matchesCentre,
} = require("../Utils/centreMatch");
const { toDateOnly } = require("../Utils/firestoreHelpers");
const { recomputeSubjectAttendance } = require("../Utils/recomputeSubjectAttendance");
const { normalizeCourseCode, resolveEnrolledSubjects } = require("../Utils/courseSubjects");
const { withStorageBucket } = require("../config/firebase");

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

const enrichWithSubjectMaps = (student, performances = [], attendances = [], testMarks = []) => {
  const listedSubjects =
    Array.isArray(student.subjects) && student.subjects.length
      ? student.subjects
      : [
          ...new Set([
            ...Object.keys(student.marks || {}),
            ...Object.keys(student.attendance || {}),
            ...performances.map((row) => row.subject),
            ...attendances.map((row) => row.subject),
            ...testMarks.map((row) => row.subject),
          ]),
        ].filter(Boolean);

  const subjects = resolveEnrolledSubjects(student.course, listedSubjects);
  const marks = {};
  const attendance = {};

  for (const subject of subjects) {
    marks[subject] = Number(student.marks?.[subject]) || 0;
    attendance[subject] = Number(student.attendance?.[subject]) || 0;
  }

  for (const perf of performances) {
    if (Object.prototype.hasOwnProperty.call(marks, perf.subject)) {
      marks[perf.subject] = Number(perf.marks) || 0;
    }
  }

  // Integrate test marks with calculated percentages
  const subjectPercentages = {};
  for (const testMark of testMarks) {
    if (testMark.subject && testMark.subjectPercentage != null) {
      subjectPercentages[testMark.subject] = Number(testMark.subjectPercentage);
    }
  }

  for (const att of attendances) {
    if (Object.prototype.hasOwnProperty.call(attendance, att.subject)) {
      attendance[att.subject] = subjectPct(att);
    }
  }

  // Calculate overall percentage as average of subject percentages from test marks
  const percentageValues = Object.values(subjectPercentages);
  const overallPercentage =
    percentageValues.length > 0
      ? Math.round((percentageValues.reduce((a, b) => a + b, 0) / percentageValues.length) * 10) / 10
      : null;

  return {
    ...student,
    course: normalizeCourseCode(student.course) || student.course,
    subjects,
    marks,
    attendance,
    performances,
    attendances,
    testMarks,
    subjectPercentages,
    overallPercentage,
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

    const enriched = await Promise.all(
      students.map(async (student) => {
        const studentKey = Number(student.id) || student.id;
        const [performances, attendances, testMarks] = await Promise.all([
          SubjectPerformance.findByStudentId(studentKey),
          SubjectAttendance.findByStudentId(studentKey),
          TestSubjectMark.findByStudent(studentKey),
        ]);
        return enrichWithSubjectMaps(student, performances, attendances, testMarks);
      })
    );

    return ok(res, { students: enriched });
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

const uploadClassPhoto = async (file, date, subject, time) => {
  if (!file?.buffer?.length) {
    throw new Error("Photo file is required");
  }

  const originalName = String(file.originalname || "photo").trim();
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
  const storagePath = `class-attendance/${date}/${subject.replace(/[^a-zA-Z0-9]+/g, "-")}/${time || "notime"}-${Date.now()}${safeExt}`;

  const uploadResult = await withStorageBucket(async (bucket) => {
    const storageFile = bucket.file(storagePath);
    await storageFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype || "image/jpeg",
        cacheControl: "public, max-age=31536000",
      },
      resumable: false,
    });

    let url;
    try {
      const [signedUrl] = await storageFile.getSignedUrl({
        action: "read",
        expires: new Date("2500-01-01T00:00:00.000Z"),
      });
      url = signedUrl;
    } catch {
      await storageFile.makePublic();
      url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    }

    return { url, storagePath };
  });

  return {
    photoUrl: uploadResult.url,
    photoPath: uploadResult.storagePath,
  };
};

exports.saveDailySubjectAttendance = wrap(
  async (req, res) => {
    const {
      date,
      subject,
      time = "",
      course = null,
      centre = null,
      topic = null,
      records,
    } = req.body || {};

    const dateOnly = toDateOnly(date);
    const subjectName = String(subject || "").trim();
    const timeKey = String(time || "").trim();
    const topicText = String(topic || "").trim() || null;

    if (!dateOnly || !subjectName) {
      return fail(res, 400, "date and subject are required");
    }

    let attendanceRecords = records;
    if (!Array.isArray(attendanceRecords)) {
      try {
        attendanceRecords = JSON.parse(String(records || "[]"));
      } catch (err) {
        attendanceRecords = [];
      }
    }

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return fail(res, 400, "records array is required");
    }

    let photoFields = {};
    if (req.file) {
      photoFields = await uploadClassPhoto(req.file, dateOnly, subjectName, timeKey);
    }

    const saved = [];
    const errors = [];
    const touchedPairs = new Map();

    for (const row of attendanceRecords) {
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
          topic: topicText,
          date: dateOnly,
          time: timeKey,
          status: row.status,
          ...photoFields,
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
      topic: topicText,
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

const getDateRangeForPeriod = (period, anchorDate) => {
  const anchor = new Date(`${anchorDate}T00:00:00`);
  if (Number.isNaN(anchor.getTime())) return { from: anchorDate, to: anchorDate };

  if (period === "weekly") {
    const day = anchor.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: toDateOnly(monday), to: toDateOnly(sunday) };
  }

  if (period === "monthly") {
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return { from: toDateOnly(from), to: toDateOnly(to) };
  }

  return { from: anchorDate, to: anchorDate };
};

const enumerateDates = (from, to) => {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    dates.push(toDateOnly(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

exports.getAttendanceSummary = wrap(
  async (req, res) => {
    const period = ["daily", "weekly", "monthly"].includes(req.query.period)
      ? req.query.period
      : "daily";
    const centre = req.query.centre || null;
    const anchorDate = toDateOnly(req.query.date) || toDateOnly(new Date());

    const { from, to } = getDateRangeForPeriod(period, anchorDate);
    const records =
      period === "daily"
        ? await DailySubjectAttendance.findByDate(anchorDate, centre)
        : await DailySubjectAttendance.findByDateRange(from, to, centre);

    const allStudents = await Student.findAll();
    const centreStudents = centre
      ? allStudents.filter((s) => matchesCentre(s.centre, centre))
      : allStudents;
    const totalStudents = centreStudents.length;

    if (period === "daily") {
      const presentIds = new Set(
        records.filter((r) => r.status === "present").map((r) => String(r.studentId))
      );
      const presentCount = presentIds.size;
      const absentCount = Math.max(totalStudents - presentCount, 0);
      const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      return ok(res, { period, from, to, totalStudents, presentCount, absentCount, percentage });
    }

    // Weekly/monthly: average each individual day's attendance % across the
    // FULL fixed period length (always 7 for week, real day-count for month).
    // A day with no records counts as 0% — never skipped, never excluded.
    const recordsByDate = {};
    for (const r of records) {
      if (!recordsByDate[r.date]) recordsByDate[r.date] = [];
      recordsByDate[r.date].push(r);
    }

    const allDates = enumerateDates(from, to);
    const dailyPercentages = allDates.map((date) => {
      const dayRecords = recordsByDate[date] || [];
      const presentIdsForDay = new Set(
        dayRecords.filter((r) => r.status === "present").map((r) => String(r.studentId))
      );
      return totalStudents > 0 ? (presentIdsForDay.size / totalStudents) * 100 : 0;
    });

    const percentage =
      dailyPercentages.length > 0
        ? Math.round(dailyPercentages.reduce((sum, p) => sum + p, 0) / dailyPercentages.length)
        : 0;

    const presentCount = Math.round((percentage / 100) * totalStudents);
    const absentCount = Math.max(totalStudents - presentCount, 0);

    return ok(res, { period, from, to, totalStudents, presentCount, absentCount, percentage });
  },
  { label: "Attendance Summary Error", message: "Failed to load attendance summary" }
);

exports.getAttendanceRange = wrap(
  async (req, res) => {
    const from = toDateOnly(req.query.from || req.query.date) || null;
    const to = toDateOnly(req.query.to || req.query.date) || from;
    const centre = req.query.centre || null;

    if (!from || !to) {
      return fail(res, 400, "from and to dates are required");
    }

    const allStudents = await Student.findAll();
    const centreStudents = centre
      ? allStudents.filter((s) => matchesCentre(s.centre, centre))
      : allStudents;
    const totalStudents = centreStudents.length;
    const days = [];

    for (const date of enumerateDates(from, to)) {
      const records = await DailySubjectAttendance.findByDate(date, centre);
      const presentIds = new Set(
        records.filter((r) => r.status === "present").map((r) => String(r.studentId))
      );
      const presentCount = presentIds.size;
      const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      days.push({ date, presentCount, totalStudents, percentage });
    }

    return ok(res, { days });
  },
  { label: "Attendance Range Error", message: "Failed to load attendance range" }
);
