const { getDb } = require("../config/firebase");
const { toDate, toDateOnly } = require("../Utils/firestoreHelpers");

const COLLECTION = "dailySubjectAttendances";

const logsRef = () => getDb().collection(COLLECTION);

const STATUS = {
  present: "present",
  absent: "absent",
};

const normalizeStatus = (status) => {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  return STATUS[key] || STATUS.absent;
};

const slugPart = (value, fallback = "na") => {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
};

const buildDocId = ({ studentId, subject, date, time = "" }) => {
  const dateOnly = toDateOnly(date);
  return [
    String(studentId),
    slugPart(subject, "subject"),
    dateOnly || "unknown-date",
    slugPart(time, "notime"),
  ].join("_");
};

const toApiLog = (docId, data) => ({
  id: docId,
  studentId: data.studentId,
  name: data.name ?? null,
  centre: data.centre ?? null,
  course: data.course ?? null,
  subject: data.subject,
  topic: data.topic ?? null,
  date: data.date,
  time: data.time ?? "",
  status: normalizeStatus(data.status),
  photoUrl: data.photoUrl ?? null,
  photoPath: data.photoPath ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findByDateSubjectTime = async ({ date, subject, time = "", centre = null }) => {
  const dateOnly = toDateOnly(date);
  if (!dateOnly || !subject) return [];

  let query = logsRef()
    .where("date", "==", dateOnly)
    .where("subject", "==", String(subject).trim());

  const timeKey = String(time || "").trim();
  if (timeKey) {
    query = query.where("time", "==", timeKey);
  }

  const snap = await query.get();
  let rows = snap.docs.map((doc) => toApiLog(doc.id, doc.data()));

  if (centre) {
    const { matchesCentre } = require("../Utils/centreMatch");
    rows = rows.filter((row) => matchesCentre(row.centre, centre));
  }

  return rows;
};
const findByDate = async (date, centre = null) => {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return [];

  const snap = await logsRef().where("date", "==", dateOnly).get();
  let rows = snap.docs.map((doc) => toApiLog(doc.id, doc.data()));

  if (centre) {
    const { matchesCentre } = require("../Utils/centreMatch");
    rows = rows.filter((row) => matchesCentre(row.centre, centre));
  }
  return rows;
};

const findByDateRange = async (fromDate, toDateArg, centre = null) => {
  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDateArg);
  if (!from || !to) return [];

  const snap = await logsRef().where("date", ">=", from).where("date", "<=", to).get();
  let rows = snap.docs.map((doc) => toApiLog(doc.id, doc.data()));

  if (centre) {
    const { matchesCentre } = require("../Utils/centreMatch");
    rows = rows.filter((row) => matchesCentre(row.centre, centre));
  }
  return rows;
};

const findByStudentAndSubject = async (studentId, subject) => {
  const snap = await logsRef()
    .where("studentId", "==", Number(studentId) || studentId)
    .where("subject", "==", String(subject).trim())
    .get();
  return snap.docs.map((doc) => toApiLog(doc.id, doc.data()));
};

const findByStudentId = async (studentId) => {
  const snap = await logsRef()
    .where("studentId", "==", Number(studentId) || studentId)
    .get();
  return snap.docs.map((doc) => toApiLog(doc.id, doc.data()));
};

const upsert = async ({
  studentId,
  name = null,
  centre = null,
  course = null,
  subject,
  date,
  time = "",
  topic = null,
  status,
  photoUrl = null,
  photoPath = null,
}) => {
  const dateOnly = toDateOnly(date);
  if (!studentId || !subject || !dateOnly) {
    throw new Error("studentId, subject, and date are required");
  }

  const subjectName = String(subject).trim();
  const timeKey = String(time || "").trim();
  const docId = buildDocId({
    studentId,
    subject: subjectName,
    date: dateOnly,
    time: timeKey,
  });

  const ref = logsRef().doc(docId);
  const existing = await ref.get();
  const now = new Date();
  const normalizedStatus = normalizeStatus(status);

  const base = existing.exists
    ? existing.data()
    : {
        id: docId,
        studentId: Number(studentId) || studentId,
        created_at: now,
      };

  const payload = {
    ...base,
    id: docId,
    studentId: Number(studentId) || studentId,
    name: name || base.name || null,
    centre: centre || base.centre || null,
    course: course || base.course || null,
    subject: subjectName,
    topic: topic || base.topic || null,
    date: dateOnly,
    time: timeKey,
    status: normalizedStatus,
    photoUrl: photoUrl ?? base.photoUrl ?? null,
    photoPath: photoPath ?? base.photoPath ?? null,
    updated_at: now,
  };

  await ref.set(payload, { merge: true });
  return toApiLog(docId, payload);
};

module.exports = {
  STATUS,
  normalizeStatus,
  buildDocId,
  slugPart,
  findByDateSubjectTime,
  findByStudentAndSubject,
  findByStudentId,
  upsert,
  findByDate,
  findByDateRange,
};
