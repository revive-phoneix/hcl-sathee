const { getDb } = require("../config/firebase");
const { toDate } = require("../Utils/firestoreHelpers");

const COLLECTION = "testSubjectMarks";

const marksRef = () => getDb().collection(COLLECTION);

const roundPct = (obtained, total) => {
  if (!total || total <= 0) return null;
  return Math.round((Number(obtained) / Number(total)) * 1000) / 10;
};

const slugPart = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "subject";

const buildDocId = (testId, studentId, subject) =>
  `${testId}_${studentId}_${slugPart(subject)}`;

const toApiMark = (docId, data) => ({
  id: docId,
  testId: data.testId,
  testType: data.testType ?? "performance",
  studentId: data.studentId,
  course: data.course ?? null,
  centre: data.centre ?? null,
  subject: data.subject,
  marksObtained: data.marksObtained ?? 0,
  totalMarks: data.totalMarks ?? 0,
  subjectPercentage: data.subjectPercentage ?? roundPct(data.marksObtained, data.totalMarks),
  answerSheetUrl: data.answerSheetUrl ?? null,
  answerSheetPath: data.answerSheetPath ?? null,
  source: data.source ?? "manual", // "manual" | "ocr"
  verifiedByMitra: Boolean(data.verifiedByMitra),
  enteredBy: data.enteredBy ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findByTest = async (testId) => {
  const snap = await marksRef().where("testId", "==", testId).get();
  return snap.docs.map((doc) => toApiMark(doc.id, doc.data()));
};

const findByStudentAndTest = async (studentId, testId) => {
  const snap = await marksRef()
    .where("testId", "==", testId)
    .where("studentId", "==", Number(studentId) || studentId)
    .get();
  return snap.docs.map((doc) => toApiMark(doc.id, doc.data()));
};

const findByStudent = async (studentId) => {
  const snap = await marksRef()
    .where("studentId", "==", Number(studentId) || studentId)
    .get();
  return snap.docs.map((doc) => toApiMark(doc.id, doc.data()));
};

const upsert = async ({
  testId,
  testType = "performance",
  studentId,
  course = null,
  centre = null,
  subject,
  marksObtained,
  totalMarks,
  subjectPercentage = null, // Optional pre-calculated percentage
  answerSheetUrl = null,
  answerSheetPath = null,
  source = "manual",
  verifiedByMitra = false,
  enteredBy = null,
}) => {
  const subjectName = String(subject || "").trim();
  if (!testId || !studentId || !subjectName) {
    throw new Error("testId, studentId, and subject are required");
  }

  const docId = buildDocId(testId, studentId, subjectName);
  const ref = marksRef().doc(docId);
  const existing = await ref.get();
  const now = new Date();

  const obtained = Math.max(0, Number(marksObtained) || 0);
  const total = Math.max(0, Number(totalMarks) || 0);

  const base = existing.exists
    ? existing.data()
    : { id: docId, testId, studentId: Number(studentId) || studentId, created_at: now };

  const payload = {
    ...base,
    id: docId,
    testId,
    testType,
    studentId: Number(studentId) || studentId,
    course: course || base.course || null,
    centre: centre || base.centre || null,
    subject: subjectName,
    marksObtained: obtained,
    totalMarks: total,
    subjectPercentage: subjectPercentage ?? roundPct(obtained, total), // Use provided or calculate
    answerSheetUrl: answerSheetUrl ?? base.answerSheetUrl ?? null,
    answerSheetPath: answerSheetPath ?? base.answerSheetPath ?? null,
    source,
    verifiedByMitra: Boolean(verifiedByMitra),
    enteredBy: enteredBy ?? base.enteredBy ?? null,
    updated_at: now,
  };

  await ref.set(payload, { merge: true });
  return toApiMark(docId, payload);
};

module.exports = {
  findByTest,
  findByStudentAndTest,
  findByStudent,
  upsert,
  roundPct,
};