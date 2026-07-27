const { getDb } = require("../config/firebase");

const COLLECTION = "equipments";

const equipmentsRef = () => getDb().collection(COLLECTION);

const WARRANTY_STATUSES = [
  "Under Warranty",
  "Out of Warranty",
  "Expired",
  "Not Applicable",
];

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const toDateOnly = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toApiEquipment = (docId, data) => ({
  id: Number(docId) || docId,
  name: data.name ?? "",
  description: data.description ?? "",
  quantity: Number(data.quantity) || 0,
  serialNumber: data.serialNumber ?? null,
  warrantyStatus: data.warrantyStatus ?? null,
  expiryDate: toDateOnly(data.expiryDate),
  centre: data.centre ?? null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findDocRefById = async (id) => {
  const ref = equipmentsRef().doc(String(id));
  const doc = await ref.get();
  if (doc.exists) return ref;

  const numericId = Number(id);
  if (!Number.isNaN(numericId)) {
    const snap = await equipmentsRef().where("id", "==", numericId).limit(1).get();
    if (!snap.empty) return snap.docs[0].ref;
  }

  return null;
};

const findAll = async () => {
  const snap = await equipmentsRef().orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => toApiEquipment(doc.id, doc.data()));
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApiEquipment(doc.id, doc.data());
};

const getNextId = async () => {
  const snap = await equipmentsRef().get();
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
    description: data.description,
    quantity: Number(data.quantity) || 0,
    serialNumber: data.serialNumber ?? null,
    warrantyStatus: data.warrantyStatus,
    expiryDate: toDateOnly(data.expiryDate),
    centre: data.centre ?? null,
    created_at: now,
    updated_at: now,
  };

  await equipmentsRef().doc(String(id)).set(payload);
  return toApiEquipment(String(id), payload);
};

const destroy = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return 0;
  await ref.delete();
  return 1;
};

module.exports = {
  WARRANTY_STATUSES,
  findAll,
  findById,
  create,
  destroy,
};
