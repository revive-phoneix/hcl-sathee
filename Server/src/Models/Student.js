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

const parseSubjectsField = (value) => {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .filter((item) => typeof item === "string" && item.trim())
          .map((item) => item.trim())
      ),
    ];
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return parseSubjectsField(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
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
  subjects: parseSubjectsField(data.subjects),
  marks: parseObjectField(data.marks),
  attendance: parseObjectField(data.attendance),
  qualifications: parseObjectField(data.qualifications),
  avatarColor: data.avatarColor ?? null,
  initials: data.initials ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findAll = async ({ limit = 200, cursor } = {}) => {
  const pageLimit = Math.min(Math.max(Number(limit) || 200, 1), 200);
  let query = studentsRef().orderBy("created_at", "desc").limit(pageLimit);
  if (cursor) {
    const cursorDoc = await studentsRef().doc(String(cursor)).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }
  const snap = await query.get();
  const students = snap.docs.map((doc) => toApiStudent(doc.id, doc.data()));
  Object.defineProperty(students, "nextCursor", {
    value: snap.docs.length === pageLimit ? snap.docs.at(-1).id : null,
    enumerable: false,
  });
  return students;
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApiStudent(doc.id, doc.data());
};

const findByIds = async (ids = []) => {
  const uniqueIds = [
    ...new Set(
      ids
        .filter((id) => id != null && id !== "")
        .map((id) => String(id))
    ),
  ];

  if (!uniqueIds.length) return [];

  const studentsById = new Map();
  for (let index = 0; index < uniqueIds.length; index += 30) {
    const chunk = uniqueIds.slice(index, index + 30);
    const snap = await studentsRef().where("__name__", "in", chunk).get();
    for (const doc of snap.docs) {
      studentsById.set(String(doc.id), toApiStudent(doc.id, doc.data()));
    }
  }

  return uniqueIds.map((id) => studentsById.get(String(id))).filter(Boolean);
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
    subjects: parseSubjectsField(data.subjects),
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
  if (data.subjects !== undefined) updated.subjects = parseSubjectsField(data.subjects);
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

module.exports = {
  findAll,
  findById,
  findByIds,
  findByEmail,
  create,
  update,
  destroy,
};
