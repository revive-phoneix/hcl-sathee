const { getDb } = require("../config/firebase");
const { toDate, getNextId: nextId } = require("../Utils/firestoreHelpers");

const COLLECTION = "subjectAttendances";

const attendancesRef = () => getDb().collection(COLLECTION);
const getNextId = () => nextId(attendancesRef());

const roundPct = (attended, total) => {
  if (!total || total <= 0) return 0;
  return Math.round((Number(attended) / Number(total)) * 1000) / 10;
};

const toApiAttendance = (docId, data) => ({
  id: Number(docId) || docId,
  studentId: data.studentId,
  subject: data.subject,
  dailyAttendancePercentage: data.dailyAttendancePercentage ?? 0,
  weeklyAttendancePercentage: data.weeklyAttendancePercentage ?? 0,
  monthlyAttendancePercentage: data.monthlyAttendancePercentage ?? 0,
  percentage: data.percentage ?? roundPct(data.classesAttended, data.totalClasses),
  totalClasses: data.totalClasses ?? 0,
  classesAttended: data.classesAttended ?? 0,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findAll = async () => {
  const snap = await attendancesRef().get();
  return snap.docs.map((doc) => toApiAttendance(doc.id, doc.data()));
};

const findByStudentId = async (studentId) => {
  const snap = await attendancesRef()
    .where("studentId", "==", Number(studentId) || studentId)
    .get();
  return snap.docs.map((doc) => toApiAttendance(doc.id, doc.data()));
};

const findByStudentAndSubject = async (studentId, subject) => {
  const subjectName = String(subject || "").trim();
  if (!subjectName) return null;

  const snap = await attendancesRef()
    .where("studentId", "==", Number(studentId) || studentId)
    .where("subject", "==", subjectName)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ref: doc.ref, data: toApiAttendance(doc.id, doc.data()) };
};

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const totalClasses = data.totalClasses ?? 0;
  const classesAttended = data.classesAttended ?? 0;
  const percentage =
    data.percentage != null
      ? Number(data.percentage)
      : roundPct(classesAttended, totalClasses);

  const payload = {
    id,
    studentId: data.studentId,
    subject: data.subject,
    dailyAttendancePercentage: data.dailyAttendancePercentage ?? percentage,
    weeklyAttendancePercentage: data.weeklyAttendancePercentage ?? percentage,
    monthlyAttendancePercentage: data.monthlyAttendancePercentage ?? percentage,
    percentage,
    totalClasses,
    classesAttended,
    created_at: now,
    updated_at: now,
  };

  await attendancesRef().doc(String(id)).set(payload);
  return toApiAttendance(String(id), payload);
};

/**
 * Create or update the running totals row for one student+subject.
 * Prefer this over create() when daily logs drive the numbers.
 */
const upsertTotals = async ({
  studentId,
  subject,
  totalClasses,
  classesAttended,
  percentage,
}) => {
  const subjectName = String(subject || "").trim();
  const total = Math.max(0, Number(totalClasses) || 0);
  const attended = Math.max(0, Number(classesAttended) || 0);
  const pct =
    percentage != null && Number.isFinite(Number(percentage))
      ? Number(percentage)
      : roundPct(attended, total);

  const existing = await findByStudentAndSubject(studentId, subjectName);
  const now = new Date();

  if (existing) {
    const payload = {
      studentId: Number(studentId) || studentId,
      subject: subjectName,
      totalClasses: total,
      classesAttended: attended,
      percentage: pct,
      // Keep period fields aligned with running subject % (UI shows one subject %)
      dailyAttendancePercentage: pct,
      weeklyAttendancePercentage: pct,
      monthlyAttendancePercentage: pct,
      updated_at: now,
    };
    await existing.ref.update(payload);
    const doc = await existing.ref.get();
    return toApiAttendance(doc.id, doc.data());
  }

  return create({
    studentId: Number(studentId) || studentId,
    subject: subjectName,
    totalClasses: total,
    classesAttended: attended,
    percentage: pct,
    dailyAttendancePercentage: pct,
    weeklyAttendancePercentage: pct,
    monthlyAttendancePercentage: pct,
  });
};

module.exports = {
  findAll,
  findByStudentId,
  findByStudentAndSubject,
  create,
  upsertTotals,
  roundPct,
};
