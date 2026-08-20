const Student = require("../Models/Student");
const SubjectPerformance = require("../Models/SubjectPerformance");
const SubjectAttendance = require("../Models/SubjectAttendance");
const TestSubjectMark = require("../Models/TestSubjectMark");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { filterByUserCentre } = require("../Utils/centreMatch");
const {
  normalizeCourseCode,
  resolveEnrolledSubjects,
  resolveSubjectsForCourse,
} = require("../Utils/courseSubjects");
const {
  isOptionalPhone10,
  normalizePhone10,
} = require("../Utils/phone");

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

const buildMapsFromRecords = (
  subjects,
  performances = [],
  attendances = [],
  fallbackMarks = {},
  fallbackAttendance = {}
) => {
  const marks = {};
  const attendance = {};
  const perfBySubject = new Map(performances.map((row) => [row.subject, row]));
  const attBySubject = new Map(attendances.map((row) => [row.subject, row]));

  for (const subject of subjects || []) {
    const perf = perfBySubject.get(subject);
    marks[subject] = perf
      ? Number(perf.marks) || 0
      : Number(fallbackMarks?.[subject]) || 0;
    attendance[subject] = attBySubject.has(subject)
      ? subjectPct(attBySubject.get(subject))
      : Number(fallbackAttendance?.[subject]) || 0;
  }

  return { marks, attendance };
};

const enrichStudent = (student, performances = [], attendances = [], testMarks = []) => {
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
  const maps = buildMapsFromRecords(
    subjects,
    performances,
    attendances,
    student.marks || {},
    student.attendance || {}
  );

  // Calculate test mark percentages
  const subjectPercentages = {};
  for (const testMark of testMarks) {
    if (testMark.subject && testMark.subjectPercentage != null) {
      subjectPercentages[testMark.subject] = Number(testMark.subjectPercentage);
    }
  }

  // Calculate overall percentage as average of subject percentages
  const percentageValues = Object.values(subjectPercentages);
  const overallPercentage =
    percentageValues.length > 0
      ? Math.round((percentageValues.reduce((a, b) => a + b, 0) / percentageValues.length) * 10) / 10
      : null;

  return {
    ...student,
    course: normalizeCourseCode(student.course) || student.course,
    subjects,
    marks: maps.marks,
    attendance: maps.attendance,
    performances,
    attendances,
    testMarks,
    subjectPercentages,
    overallPercentage,
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
    const studentsPage = await Student.findAll({
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    const students = filterByUserCentre(studentsPage, req.user);

    // Per-student subject rows only — never scan entire performance/attendance collections.
    const enriched = await Promise.all(
      students.map(async (student) => {
        const studentKey = Number(student.id) || student.id;
        const [performances, attendances, testMarks] = await Promise.all([
          SubjectPerformance.findByStudentId(studentKey),
          SubjectAttendance.findByStudentId(studentKey),
          TestSubjectMark.findByStudent(studentKey),
        ]);
        return enrichStudent(student, performances, attendances, testMarks);
      })
    );

    return ok(res, { students: enriched, nextCursor: studentsPage.nextCursor });
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

    const normalizedPhone = normalizePhone10(phone);
    if (!normalizedPhone) {
      return fail(res, 400, "Phone number must be exactly 10 digits");
    }

    const fatherPhone = parents?.fatherPhone;
    const motherPhone = parents?.motherPhone;
    if (!isOptionalPhone10(fatherPhone) || !isOptionalPhone10(motherPhone)) {
      return fail(res, 400, "Parent phone numbers must be exactly 10 digits");
    }

    const normalizedParents = {
      ...(parents || {}),
      fatherPhone: fatherPhone?.trim() ? normalizePhone10(fatherPhone) : fatherPhone || "",
      motherPhone: motherPhone?.trim() ? normalizePhone10(motherPhone) : motherPhone || "",
    };

    const normalizedCourse = normalizeCourseCode(course) || course?.trim() || null;
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
      phone: normalizedPhone,
      centre: centre?.trim() || null,
      course: normalizedCourse,
      category: category?.trim() || null,
      address: address || null,
      parents: normalizedParents,
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

exports.updateStudent = wrap(
  async (req, res) => {
    const existing = await Student.findById(req.params.id);
    if (!existing) {
      return fail(res, 404, "Student not found");
    }

    const scoped = filterByUserCentre([existing], req.user);
    if (!scoped.length) {
      return fail(res, 403, "You can only update students from your centre");
    }

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

    const patch = {};
    if (studentId != null) {
      const trimmed = String(studentId).trim();
      if (!trimmed) {
        return fail(res, 400, "Student ID cannot be empty");
      }
      patch.studentId = trimmed;
    }
    if (enrollmentNo != null) {
      patch.enrollmentNo = String(enrollmentNo).trim() || null;
    }
    if (name != null) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return fail(res, 400, "Name cannot be empty");
      }
      patch.name = trimmed;
    }
    if (gender != null) {
      patch.gender = String(gender).trim();
    }
    if (email != null) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        return fail(res, 400, "Email cannot be empty");
      }
      const found = await Student.findByEmail(normalizedEmail);
      if (found && String(found.id) !== String(existing.id)) {
        return fail(res, 409, "A student with this email already exists");
      }
      patch.email = normalizedEmail;
    }
    if (phone != null) {
      const normalizedPhone = normalizePhone10(phone);
      if (!normalizedPhone) {
        return fail(res, 400, "Phone number must be exactly 10 digits");
      }
      patch.phone = normalizedPhone;
    }
    if (centre != null) {
      patch.centre = String(centre).trim() || null;
    }
    if (course != null) {
      patch.course = normalizeCourseCode(String(course).trim()) || String(course).trim() || null;
    }
    if (category != null) {
      patch.category = String(category).trim() || null;
    }
    if (address != null) {
      patch.address = String(address).trim() || null;
    }
    if (parents != null) {
      const normalizedParents = { ...(parents || {}) };
      if (normalizedParents.fatherPhone != null) {
        if (!isOptionalPhone10(normalizedParents.fatherPhone)) {
          return fail(res, 400, "Parent phone numbers must be exactly 10 digits");
        }
        normalizedParents.fatherPhone = normalizedParents.fatherPhone?.trim()
          ? normalizePhone10(normalizedParents.fatherPhone)
          : "";
      }
      if (normalizedParents.motherPhone != null) {
        if (!isOptionalPhone10(normalizedParents.motherPhone)) {
          return fail(res, 400, "Parent phone numbers must be exactly 10 digits");
        }
        normalizedParents.motherPhone = normalizedParents.motherPhone?.trim()
          ? normalizePhone10(normalizedParents.motherPhone)
          : "";
      }
      patch.parents = normalizedParents;
    }
    if (subjects != null) {
      patch.subjects = subjects;
    }
    if (marks != null) {
      patch.marks = marks;
    }
    if (attendance != null) {
      patch.attendance = attendance;
    }
    if (qualifications != null) {
      patch.qualifications = qualifications;
    }
    if (avatarColor != null) {
      patch.avatarColor = avatarColor;
    }
    if (initials != null) {
      patch.initials = initials;
    }

    if (!Object.keys(patch).length) {
      return fail(res, 400, "No valid fields to update");
    }

    const updated = await Student.update(req.params.id, patch);
    if (!updated) {
      return fail(res, 404, "Student not found");
    }

    return ok(res, { message: "Student updated successfully", student: updated });
  },
  { label: "Update Student Error", message: "Failed to update student" }
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
