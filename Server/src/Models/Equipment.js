const { getDb } = require("../config/firebase");
const { toDate, toDateOnly, findDocRefById: findRef, getNextId: nextId } = require("../Utils/firestoreHelpers");

const COLLECTION = "equipments";

const equipmentsRef = () => getDb().collection(COLLECTION);
const findDocRefById = (id) => findRef(equipmentsRef(), id);
const getNextId = () => nextId(equipmentsRef());

const WARRANTY_STATUSES = [
  "Under Warranty",
  "Out of Warranty",
  "Expired",
  "Not Applicable",
];

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
