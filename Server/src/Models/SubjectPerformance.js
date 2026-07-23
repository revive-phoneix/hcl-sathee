const { getDb } = require("../config/firebase");

const COLLECTION = "subjectPerformances";

const performancesRef = () => getDb().collection(COLLECTION);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const toApiPerformance = (docId, data) => ({
  id: Number(docId) || docId,
  studentId: data.studentId,
  subject: data.subject,
  marks: data.marks,
  maxMarks: data.maxMarks ?? 100,
  grade: data.grade ?? null,
  remarks: data.remarks ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findAll = async () => {
  const snap = await performancesRef().get();
  return snap.docs.map((doc) => toApiPerformance(doc.id, doc.data()));
};

const findByStudentId = async (studentId) => {
  const snap = await performancesRef()
    .where("studentId", "==", Number(studentId) || studentId)
    .get();
  return snap.docs.map((doc) => toApiPerformance(doc.id, doc.data()));
};

const getNextId = async () => {
  const snap = await performancesRef().get();
  if (snap.empty) return 1;

  let maxId = 0;
  for (const doc of snap.docs) {
    const docId = Number(doc.id);
    const fieldId = Number(doc.data().id);
    if (!Number.isNaN(docId)) maxId = Math.max(maxId, docId);
    if (!Number.isNaN(fieldId)) maxId = Math.max(maxId, fieldId);
  }

  return maxId + 1;
};

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const payload = {
    id,
    studentId: data.studentId,
    subject: data.subject,
    marks: data.marks,
    maxMarks: data.maxMarks ?? 100,
    grade: data.grade ?? null,
    remarks: data.remarks ?? null,
    created_at: now,
    updated_at: now,
  };

  await performancesRef().doc(String(id)).set(payload);
  return toApiPerformance(String(id), payload);
};

module.exports = {
  findAll,
  findByStudentId,
  create,
};
