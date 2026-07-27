const { getDb } = require("../config/firebase");
const { toDate, findDocRefById: findRef, getNextId: nextId } = require("../Utils/firestoreHelpers");

const COLLECTION = "users";

const usersRef = () => getDb().collection(COLLECTION);
const findDocRefById = (id) => findRef(usersRef(), id);
const getNextId = () => nextId(usersRef());

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const normalizeAvailableDays = (value) => {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(WEEKDAYS.map((d) => d.toLowerCase()));
  const seen = new Set();
  const days = [];

  for (const entry of value) {
    const raw = String(entry || "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!allowed.has(key) || seen.has(key)) continue;
    seen.add(key);
    const match = WEEKDAYS.find((d) => d.toLowerCase() === key);
    if (match) days.push(match);
  }

  return WEEKDAYS.filter((day) => days.includes(day));
};

const isMitraRole = (role = "") =>
  String(role || "").trim().toUpperCase() === "SATHEE MITRA";

/** isVishist only applies to Sathee Mitra; everyone else is false. */
const normalizeIsVishist = (role, value) => {
  if (!isMitraRole(role)) return false;
  return value === true || value === "true" || value === 1 || value === "1";
};

const toApiUser = (docId, data) => ({
  id: Number(docId) || docId,
  name: data.name,
  email: typeof data.email === "string" ? data.email.trim().toLowerCase() : data.email,
  password: data.password == null ? null : String(data.password),
  phone: data.phone ?? null,
  role: data.role,
  centre: data.centre ?? null,
  availableDays: normalizeAvailableDays(data.availableDays),
  isVishist: normalizeIsVishist(data.role, data.isVishist),
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

let isVishistBackfillDone = false;

/** Existing Sathee Mitra without isVishist → write false once. */
const backfillMissingIsVishist = async () => {
  if (isVishistBackfillDone) return;
  isVishistBackfillDone = true;

  try {
    const snap = await usersRef().get();
    const batch = getDb().batch();
    let ops = 0;

    for (const doc of snap.docs) {
      const data = doc.data() || {};
      if (!isMitraRole(data.role)) continue;
      if (Object.prototype.hasOwnProperty.call(data, "isVishist")) continue;
      batch.update(doc.ref, { isVishist: false, updated_at: new Date() });
      ops += 1;
    }

    if (ops > 0) {
      await batch.commit();
      console.log(`Backfilled isVishist=false on ${ops} Sathee Mitra user(s)`);
    }
  } catch (error) {
    console.error("isVishist backfill failed:", error);
    isVishistBackfillDone = false;
  }
};

const findAll = async () => {
  await backfillMissingIsVishist();
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

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const role = data.role;
  const payload = {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    password: data.password == null ? null : String(data.password),
    role,
    centre: data.centre ?? null,
    availableDays: isMitraRole(role)
      ? normalizeAvailableDays(data.availableDays)
      : [],
    isVishist: normalizeIsVishist(role, data.isVishist),
    created_at: now,
    updated_at: now,
  };

  await usersRef().doc(String(id)).set(payload);
  return toApiUser(String(id), payload);
};

const update = async (id, data) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;

  const existing = (await ref.get()).data() || {};
  const nextRole = data.role != null ? data.role : existing.role;
  const updated = { ...data, updated_at: new Date() };

  if (Object.prototype.hasOwnProperty.call(data, "availableDays")) {
    updated.availableDays = isMitraRole(nextRole)
      ? normalizeAvailableDays(data.availableDays)
      : [];
  }

  if (Object.prototype.hasOwnProperty.call(data, "isVishist") || data.role != null) {
    updated.isVishist = normalizeIsVishist(
      nextRole,
      Object.prototype.hasOwnProperty.call(data, "isVishist")
        ? data.isVishist
        : existing.isVishist
    );
  }

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
    availableDays: normalizeAvailableDays(row.availableDays),
    isVishist: normalizeIsVishist(row.role, row.isVishist),
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date(),
  };

  await usersRef().doc(String(id)).set(payload);
  return toApiUser(String(id), payload);
};

module.exports = {
  WEEKDAYS,
  normalizeAvailableDays,
  normalizeIsVishist,
  findAll,
  findByEmail,
  findById,
  findByPhone,
  create,
  update,
  destroy,
  importFromMysql,
  backfillMissingIsVishist,
};
