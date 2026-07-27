const { getDb } = require("../config/firebase");
const { toDate, findDocRefById: findRef, getNextId: nextId } = require("../Utils/firestoreHelpers");

const COLLECTION = "students";

const studentsRef = () => getDb().collection(COLLECTION);
const findDocRefById = (id) => findRef(studentsRef(), id);
const getNextId = () => nextId(studentsRef());

const parseObjectField = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const toApiStudent = (docId, data) => ({
  id: Number(docId) || docId,
  studentId: data.studentId,
  enrollmentNo: data.enrollmentNo ?? null,
  name: data.name,
  gender: data.gender,
  email: typeof data.email === "string" ? data.email.trim().toLowerCase() : data.email,
  phone: data.phone ?? null,
  centre: data.centre ?? null,
  course: data.course ?? null,
  category: data.category ?? null,
  address: data.address ?? null,
  parents: parseObjectField(data.parents),
  marks: parseObjectField(data.marks),
  attendance: parseObjectField(data.attendance),
  qualifications: parseObjectField(data.qualifications),
  avatarColor: data.avatarColor ?? null,
  initials: data.initials ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findAll = async () => {
  const snap = await studentsRef().orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => toApiStudent(doc.id, doc.data()));
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApiStudent(doc.id, doc.data());
};

const findByEmail = async (email) => {
  const normalized = email.trim().toLowerCase();
  const snap = await studentsRef().where("email", "==", normalized).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return toApiStudent(doc.id, doc.data());
};

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const payload = {
    id,
    studentId: data.studentId,
    enrollmentNo: data.enrollmentNo ?? null,
    name: data.name,
    gender: data.gender,
    email: data.email,
    phone: data.phone ?? null,
    centre: data.centre ?? null,
    course: data.course ?? null,
    category: data.category ?? null,
    address: data.address ?? null,
    parents: parseObjectField(data.parents),
    marks: parseObjectField(data.marks),
    attendance: parseObjectField(data.attendance),
    qualifications: parseObjectField(data.qualifications),
    avatarColor: data.avatarColor ?? null,
    initials: data.initials ?? null,
    created_at: now,
    updated_at: now,
  };

  await studentsRef().doc(String(id)).set(payload);
  return toApiStudent(String(id), payload);
};

const update = async (id, data) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;

  const updated = { ...data, updated_at: new Date() };
  if (data.parents !== undefined) updated.parents = parseObjectField(data.parents);
  if (data.marks !== undefined) updated.marks = parseObjectField(data.marks);
  if (data.attendance !== undefined) updated.attendance = parseObjectField(data.attendance);
  if (data.qualifications !== undefined) {
    updated.qualifications = parseObjectField(data.qualifications);
  }

  await ref.update(updated);
  const doc = await ref.get();
  return toApiStudent(doc.id, doc.data());
};

const destroy = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return 0;
  await ref.delete();
  return 1;
};

/** One-time import from MySQL row shape into Firestore (preserves numeric id). */
const importFromMysql = async (row) => {
  const id = row.id;
  const payload = {
    id,
    studentId: row.studentId,
    enrollmentNo: row.enrollmentNo ?? null,
    name: row.name,
    gender: row.gender,
    email: String(row.email || "").trim().toLowerCase(),
    phone: row.phone ?? null,
    centre: row.centre ?? null,
    course: row.course ?? null,
    category: row.category ?? null,
    address: row.address ?? null,
    parents: parseObjectField(row.parents),
    marks: parseObjectField(row.marks),
    attendance: parseObjectField(row.attendance),
    qualifications: parseObjectField(row.qualifications),
    avatarColor: row.avatarColor ?? null,
    initials: row.initials ?? null,
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date(),
  };

  await studentsRef().doc(String(id)).set(payload);
  return toApiStudent(String(id), payload);
};

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  destroy,
  importFromMysql,
};
