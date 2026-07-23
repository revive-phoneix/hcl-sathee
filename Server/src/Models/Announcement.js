const { getDb } = require("../config/firebase");

const COLLECTION = "announcements";

const announcementsRef = () => getDb().collection(COLLECTION);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const toApiAnnouncement = (docId, data) => ({
  id: Number(docId) || docId,
  title: data.title,
  description: data.description,
  category: data.category || "General",
  priority: data.priority || "Medium",
  postedBy: data.postedBy || "Admin",
  centre: data.centre ?? null,
  attachmentName: data.attachmentName ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findDocRefById = async (id) => {
  const ref = announcementsRef().doc(String(id));
  const doc = await ref.get();
  if (doc.exists) return ref;

  const numericId = Number(id);
  if (!Number.isNaN(numericId)) {
    const snap = await announcementsRef().where("id", "==", numericId).limit(1).get();
    if (!snap.empty) return snap.docs[0].ref;
  }

  return null;
};

const findAll = async () => {
  const snap = await announcementsRef().orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => toApiAnnouncement(doc.id, doc.data()));
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApiAnnouncement(doc.id, doc.data());
};

const getNextId = async () => {
  const snap = await announcementsRef().get();
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
    title: data.title,
    description: data.description,
    category: data.category || "General",
    priority: data.priority || "Medium",
    postedBy: data.postedBy || "Admin",
    centre: data.centre ?? null,
    attachmentName: data.attachmentName ?? null,
    created_at: now,
    updated_at: now,
  };

  await announcementsRef().doc(String(id)).set(payload);
  return toApiAnnouncement(String(id), payload);
};

const update = async (id, data) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;

  const updated = { ...data, updated_at: new Date() };
  await ref.update(updated);
  const doc = await ref.get();
  return toApiAnnouncement(doc.id, doc.data());
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
    title: row.title,
    description: row.description,
    category: row.category || "General",
    priority: row.priority || "Medium",
    postedBy: row.postedBy || "Admin",
    centre: row.centre ?? null,
    attachmentName: row.attachmentName ?? null,
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date(),
  };

  await announcementsRef().doc(String(id)).set(payload);
  return toApiAnnouncement(String(id), payload);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  destroy,
  importFromMysql,
};
