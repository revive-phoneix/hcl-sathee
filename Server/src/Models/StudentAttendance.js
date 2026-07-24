const { getDb } = require("../config/firebase");

const COLLECTION = "studentAttendances";

const attendancesRef = () => getDb().collection(COLLECTION);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const STATUS_PERCENT = {
  present: 100,
  late: 50,
  absent: 0,
};

const normalizeStatus = (status) => {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  if (STATUS_PERCENT[key] != null) return key;
  return "absent";
};

const resolvePercentage = (status, dailyAttendancePercentage) => {
  if (
    dailyAttendancePercentage != null &&
    dailyAttendancePercentage !== "" &&
    Number.isFinite(Number(dailyAttendancePercentage))
  ) {
    return Math.max(0, Math.min(100, Number(dailyAttendancePercentage)));
  }
  return STATUS_PERCENT[normalizeStatus(status)] ?? 0;
};

const toApiRecord = (docId, data) => ({
  id: docId,
  studentId: data.studentId,
  name: data.name ?? null,
  centre: data.centre ?? null,
  date: data.date,
  status: normalizeStatus(data.status),
  dailyAttendancePercentage: resolvePercentage(
    data.status,
    data.dailyAttendancePercentage
  ),
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const buildDocId = (studentId, date) => `${studentId}_${date}`;

const findByDate = async (date) => {
  const snap = await attendancesRef().where("date", "==", date).get();
  return snap.docs.map((doc) => toApiRecord(doc.id, doc.data()));
};

const findByDateRange = async (fromDate, toDate) => {
  const snap = await attendancesRef()
    .where("date", ">=", fromDate)
    .where("date", "<=", toDate)
    .get();
  return snap.docs.map((doc) => toApiRecord(doc.id, doc.data()));
};

const findByStudentAndDate = async (studentId, date) => {
  const docId = buildDocId(studentId, date);
  const doc = await attendancesRef().doc(docId).get();
  if (!doc.exists) return null;
  return toApiRecord(doc.id, doc.data());
};

const upsert = async ({
  studentId,
  name = null,
  centre = null,
  date,
  status,
  dailyAttendancePercentage,
}) => {
  const docId = buildDocId(studentId, date);
  const ref = attendancesRef().doc(docId);
  const existing = await ref.get();
  const now = new Date();
  const normalizedStatus = normalizeStatus(status);
  const percent = resolvePercentage(normalizedStatus, dailyAttendancePercentage);

  const base = existing.exists
    ? existing.data()
    : {
        id: docId,
        studentId: Number(studentId) || studentId,
        created_at: now,
      };

  const payload = {
    ...base,
    studentId: Number(studentId) || studentId,
    name: name || base.name || null,
    centre: centre || base.centre || null,
    date,
    status: normalizedStatus,
    dailyAttendancePercentage: percent,
    updated_at: now,
  };

  await ref.set(payload, { merge: true });
  return toApiRecord(docId, payload);
};

module.exports = {
  findByDate,
  findByDateRange,
  findByStudentAndDate,
  upsert,
  STATUS_PERCENT,
  normalizeStatus,
  resolvePercentage,
};
