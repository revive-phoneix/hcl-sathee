const { getDb } = require("../config/firebase");

const COLLECTION = "users";

const usersRef = () => getDb().collection(COLLECTION);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const toApiUser = (docId, data) => ({
  id: Number(docId) || docId,
  name: data.name,
  email: typeof data.email === "string" ? data.email.trim().toLowerCase() : data.email,
  password: data.password == null ? null : String(data.password),
  phone: data.phone ?? null,
  role: data.role,
  centre: data.centre ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findDocRefById = async (id) => {
  const ref = usersRef().doc(String(id));
  const doc = await ref.get();
  if (doc.exists) return ref;

  const numericId = Number(id);
  if (!Number.isNaN(numericId)) {
    const snap = await usersRef().where("id", "==", numericId).limit(1).get();
    if (!snap.empty) return snap.docs[0].ref;
  }

  return null;
};

const findAll = async () => {
  const snap = await usersRef().orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => toApiUser(doc.id, doc.data()));
};

const findByEmail = async (email) => {
  const normalized = email.trim().toLowerCase();
  const snap = await usersRef().where("email", "==", normalized).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return toApiUser(doc.id, doc.data());
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApiUser(doc.id, doc.data());
};

const findByPhone = async (phone) => {
  const snap = await usersRef().where("phone", "==", phone.trim()).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return toApiUser(doc.id, doc.data());
};

const getNextId = async () => {
  const snap = await usersRef().get();
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
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    password: data.password == null ? null : String(data.password),
    role: data.role,
    centre: data.centre ?? null,
    created_at: now,
    updated_at: now,
  };

  await usersRef().doc(String(id)).set(payload);
  return toApiUser(String(id), payload);
};

const update = async (id, data) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;

  const updated = { ...data, updated_at: new Date() };
  await ref.update(updated);
  const doc = await ref.get();
  return toApiUser(doc.id, doc.data());
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
    name: row.name,
    email: row.email.trim().toLowerCase(),
    password: row.password == null ? null : String(row.password),
    phone: row.phone ?? null,
    role: row.role,
    centre: row.centre ?? null,
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date(),
  };

  await usersRef().doc(String(id)).set(payload);
  return toApiUser(String(id), payload);
};

module.exports = {
  findAll,
  findByEmail,
  findById,
  findByPhone,
  create,
  update,
  destroy,
  importFromMysql,
};
