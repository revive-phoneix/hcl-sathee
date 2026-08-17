const path = require("path");
const Test = require("../Models/Test");
const TestSubjectMark = require("../Models/TestSubjectMark");
const Student = require("../Models/Student");
const { withStorageBucket } = require("../config/firebase");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { buildCourseProgressTimeline } = require("../Utils/testProgress");
const { matchesCentre, isAdminRole } = require("../Utils/centreMatch");

const assertCentreAccess = (req, centre) => {
  if (isAdminRole(req.user?.role)) return true;
  if (!req.user?.centre) return false;
  return matchesCentre(centre, req.user.centre);
};

exports.listTests = wrap(
  async (req, res) => {
    const course = String(req.query.course || "").trim().toUpperCase();
    if (!course) return fail(res, 400, "course is required");

    const centre = isAdminRole(req.user?.role) ? req.query.centre || null : req.user?.centre || null;
    const tests = await Test.findByCourse(course, centre);
    return ok(res, { tests });
  },
  { label: "List Tests Error", message: "Failed to fetch tests" }
);

exports.createTest = wrap(
  async (req, res) => {
    const { name, course, centre, testDate } = req.body;
    if (!course) return fail(res, 400, "course is required");

    const resolvedCentre = centre || req.user?.centre || null;
    if (!assertCentreAccess(req, resolvedCentre)) {
      return fail(res, 403, "Centre access denied");
    }

    const test = await Test.create({
      name,
      course,
      centre: resolvedCentre,
      testDate,
      createdBy: req.user?.id || null,
    });
    return ok(res, 201, { test });
  },
  { label: "Create Test Error", message: "Failed to create test" }
);

const uploadAnswerSheet = async (file, testId, studentId) => {
  const ext = path.extname(file.originalname || "").toLowerCase() || ".pdf";
  const safeExt = [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".doc"].includes(ext) ? ext : ".pdf";
  const storagePath = `test-marks/${testId}/${studentId}-${Date.now()}${safeExt}`;

  return withStorageBucket(async (bucket) => {
    const storageFile = bucket.file(storagePath);
    await storageFile.save(file.buffer, {
      metadata: { contentType: file.mimetype || "application/pdf", cacheControl: "public, max-age=31536000" },
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
};

const SLOT_LABELS = {
  performance: ["Week 1", "Week 2", "Week 3"],
  "pre-mid": ["Month 1", "Month 2", "Month 3"],
  mid: ["Mid 1", "Mid 2", "Mid 3"],
};

exports.getTestTypeProgress = wrap(
  async (req, res) => {
    const course = String(req.query.course || "").trim().toUpperCase();
    const testType = String(req.query.testType || "").trim();
    const centre = req.query.centre || null;

    if (!course || !SLOT_LABELS[testType]) {
      return fail(res, 400, "Valid course and testType are required");
    }

    const [tests, marks] = await Promise.all([
      Test.findByCourse(course, centre),
      TestSubjectMark.findByCourse(course, centre),
    ]);

    const marksByTestId = {};
    for (const mark of marks) {
      if (!marksByTestId[mark.testId]) marksByTestId[mark.testId] = [];
      marksByTestId[mark.testId].push(mark);
    }

    // A Test's testType is only known from marks saved against it.
    const matchingTests = tests
      .filter((t) => (marksByTestId[t.id] || []).some((m) => m.testType === testType))
      .sort((a, b) => (a.testNumber || 0) - (b.testNumber || 0));

    const labels = SLOT_LABELS[testType];
    const slots = labels.map((label, index) => {
      const test = matchingTests[index];
      if (!test) return { label, average: null, studentCount: 0, testName: null };

      const testMarks = (marksByTestId[test.id] || []).filter((m) => m.testType === testType);
      const byStudent = {};
      for (const m of testMarks) {
        if (!byStudent[m.studentId]) byStudent[m.studentId] = [];
        byStudent[m.studentId].push(Number(m.subjectPercentage) || 0);
      }

      const studentAverages = Object.values(byStudent).map(
        (pcts) => pcts.reduce((sum, p) => sum + p, 0) / pcts.length
      );

      const average = studentAverages.length
        ? Math.round((studentAverages.reduce((sum, p) => sum + p, 0) / studentAverages.length) * 10) / 10
        : null;

      return { label, average, studentCount: studentAverages.length, testName: test.name };
    });

    return ok(res, { course, testType, slots });
  },
  { label: "Test Type Progress Error", message: "Failed to load test type progress" }
);

exports.deleteTest = wrap(
  async (req, res) => {
    const testId = String(req.params.id || "").trim();
    if (!testId) return fail(res, 400, "testId is required");

    const test = await Test.findById(testId);
    if (!test) return fail(res, 404, "Test not found");
    if (!assertCentreAccess(req, test.centre)) {
      return fail(res, 403, "Centre access denied");
    }

    await TestSubjectMark.deleteByTestId(testId);
    const deleted = await Test.removeById(testId);
    if (!deleted) return fail(res, 404, "Test not found");

    return ok(res, { message: "Test deleted", testId });
  },
  { label: "Delete Test Error", message: "Failed to delete test" }
);

exports.saveTestMarks = wrap(
  async (req, res) => {
    const { testId, testType = "performance", studentId, course = null, centre = null, records } = req.body || {};

    if (!testId || !studentId) {
      return fail(res, 400, "testId and studentId are required");
    }

    const student = await Student.findById(studentId);
    if (!student) return fail(res, 404, "Student not found");
    if (!assertCentreAccess(req, centre || student.centre)) {
      return fail(res, 403, "Centre access denied for this student");
    }

    const test = await Test.findById(testId);
    if (!test) return fail(res, 404, "Test not found");
    if (course && test.course !== String(course).trim().toUpperCase()) {
      return fail(res, 400, "testId does not belong to the given course");
    }

    let subjectRecords = records;
    if (!Array.isArray(subjectRecords)) {
      try {
        subjectRecords = JSON.parse(String(records || "[]"));
      } catch {
        subjectRecords = [];
      }
    }
    if (!subjectRecords.length) {
      return fail(res, 400, "records array (subject, marksObtained, totalMarks) is required");
    }

    let answerSheetUrl = null;
    let answerSheetPath = null;
    if (req.file) {
      const uploaded = await uploadAnswerSheet(req.file, testId, student.id);
      answerSheetUrl = uploaded.url;
      answerSheetPath = uploaded.storagePath;
    }

    const saved = [];
    const errors = [];
    for (const row of subjectRecords) {
      try {
        const mark = await TestSubjectMark.upsert({
          testId,
          testType: row.testType || testType,
          studentId: student.id,
          course: course || student.course,
          centre: centre || student.centre,
          subject: row.subject,
          marksObtained: row.marksObtained,
          totalMarks: row.totalMarks,
          subjectPercentage: row.subjectPercentage, // Pre-calculated percentage from frontend
          answerSheetUrl,
          answerSheetPath,
          source: row.source || "manual",
          verifiedByMitra: true,
          enteredBy: req.user?.id || null,
        });
        saved.push(mark);
      } catch (error) {
        errors.push({ subject: row.subject, message: error.message });
      }
    }

    return ok(res, {
      message: "Test marks saved",
      testId,
      studentId: student.id,
      savedCount: saved.length,
      records: saved,
      errors,
    });
  },
  { label: "Save Test Marks Error", message: "Failed to save test marks", useErrorMessage: true }
);

exports.getCourseProgress = wrap(
  async (req, res) => {
    const course = String(req.query.course || "").trim();
    if (!course) return fail(res, 400, "course is required");

    const centre = isAdminRole(req.user?.role) ? req.query.centre || null : req.user?.centre || null;
    const timeline = await buildCourseProgressTimeline(course, centre);
    return ok(res, { course, centre, timeline });
  },
  { label: "Course Progress Error", message: "Failed to build course progress" }
);