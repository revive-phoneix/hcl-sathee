const Student = require("../Models/Student");
const SubjectPerformance = require("../Models/SubjectPerformance");
const SubjectAttendance = require("../Models/SubjectAttendance");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");
const { resolveSubjectsForCourse } = require("../Utils/courseSubjects");

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

const buildMapsFromRecords = (subjects, performances = [], attendances = []) => {
  const marks = {};
  const attendance = {};
  const perfBySubject = new Map(performances.map((row) => [row.subject, row]));
  const attBySubject = new Map(attendances.map((row) => [row.subject, row]));

  for (const subject of subjects || []) {
    const perf = perfBySubject.get(subject);
    marks[subject] = perf ? Number(perf.marks) || 0 : 0;
    attendance[subject] = subjectPct(attBySubject.get(subject));
  }

  // Include any leftover records not listed in subjects
  for (const perf of performances) {
    if (marks[perf.subject] === undefined) {
      marks[perf.subject] = Number(perf.marks) || 0;
    }
  }
  for (const att of attendances) {
    if (attendance[att.subject] === undefined) {
      attendance[att.subject] = subjectPct(att);
    }
  }

  return { marks, attendance };
};

const enrichStudent = (student, performances = [], attendances = []) => {
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

  const hasSubjectRecords = performances.length > 0 || attendances.length > 0;
  const maps = hasSubjectRecords
    ? buildMapsFromRecords(subjects, performances, attendances)
    : {
        marks: student.marks || {},
        attendance: student.attendance || {},
      };

  return {
    ...student,
    subjects,
    marks: maps.marks,
    attendance: maps.attendance,
    performances,
    attendances,
  };
};

const seedSubjectRecords = async (studentId, subjects, marksInput = {}, attendanceInput = {}) => {
  const performances = [];
  const attendances = [];

  for (const subject of subjects) {
    const markValue = Number(marksInput?.[subject]);
    const attValue = Number(attendanceInput?.[subject]);

    const [performance, attendance] = await Promise.all([
      SubjectPerformance.create({
        studentId,
        subject,
        marks: Number.isFinite(markValue) ? markValue : 0,
        maxMarks: 100,
      }),
      SubjectAttendance.create({
        studentId,
        subject,
        dailyAttendancePercentage: Number.isFinite(attValue) ? attValue : 0,
        weeklyAttendancePercentage: Number.isFinite(attValue) ? attValue : 0,
        monthlyAttendancePercentage: Number.isFinite(attValue) ? attValue : 0,
        totalClasses: 0,
        classesAttended: 0,
      }),
    ]);

    performances.push(performance);
    attendances.push(attendance);
  }

  return { performances, attendances };
};

exports.getStudents = wrap(
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
        enrichStudent(
          student,
          performancesByStudent.get(student.id) || [],
          attendancesByStudent.get(student.id) || []
        )
      ),
    });
  },
  { label: "Get Students Error", message: "Failed to fetch students" }
);

exports.addStudent = wrap(
  async (req, res) => {
    const {
      studentId,
      enrollmentNo,
      name,
      gender,
      email,
      phone,
      centre,
      course,
      category,
      address,
      parents,
      subjects,
      marks,
      attendance,
      qualifications,
      avatarColor,
      initials,
    } = req.body;

    if (!name || !gender || !email) {
      return fail(res, 400, "Name, gender, and email are required");
    }

    const normalizedCourse = course?.trim() || null;
    const resolved = resolveSubjectsForCourse(
      normalizedCourse,
      subjects,
      marks,
      attendance
    );
    if (!resolved.ok) {
      return fail(res, 400, resolved.message);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await Student.findByEmail(normalizedEmail)) {
      return fail(res, 409, "A student with this email already exists");
    }

    const suffix = Date.now().toString().slice(-6);
    const initialMaps = buildMapsFromRecords(resolved.subjects, [], []);

    const student = await Student.create({
      studentId: studentId?.trim() || `STU${suffix}`,
      enrollmentNo: enrollmentNo?.trim() || `ENR${suffix}`,
      name: name.trim(),
      gender: gender.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      centre: centre?.trim() || null,
      course: normalizedCourse,
      category: category?.trim() || null,
      address: address || null,
      parents: parents || {},
      subjects: resolved.subjects,
      marks: marks && typeof marks === "object" ? marks : initialMaps.marks,
      attendance:
        attendance && typeof attendance === "object" ? attendance : initialMaps.attendance,
      qualifications: qualifications || {},
      avatarColor: avatarColor || null,
      initials: initials || null,
    });

    const { performances, attendances } = await seedSubjectRecords(
      student.id,
      resolved.subjects,
      marks,
      attendance
    );

    return ok(res, 201, {
      student: enrichStudent(student, performances, attendances),
    });
  },
  { label: "Add Student Error", message: "Failed to add student" }
);

exports.deleteStudent = wrap(
  async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return fail(res, 404, "Student not found");
    }

    const scoped = filterByUserCentre([student], req.user);
    if (!scoped.length) {
      return fail(res, 403, "You can only delete students from your centre");
    }

    if (!(await Student.destroy(req.params.id))) {
      return fail(res, 404, "Student not found");
    }

    return ok(res, { message: "Student deleted successfully" });
  },
  { label: "Delete Student Error", message: "Failed to delete student" }
);
