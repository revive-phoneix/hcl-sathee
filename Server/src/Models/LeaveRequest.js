const { getDb } = require("../config/firebase");
const {
  toDate,
  findDocRefById: findRef,
  getNextId: nextId,
} = require("../Utils/firestoreHelpers");

const COLLECTION = "leaveRequests";

const leaveRef = () => getDb().collection(COLLECTION);
const findDocRefById = (id) => findRef(leaveRef(), id);
const getNextId = () => nextId(leaveRef());

const toApi = (docId, data = {}) => ({
  id: Number(docId) || docId,
  userId: data.userId ?? null,
  name: data.name ?? null,
  email: data.email ?? null,
  centre: data.centre ?? null,
  fromDate: data.fromDate ?? null,
  toDate: data.toDate ?? null,
  reason: data.reason ?? "",
  status: data.status || "pending",
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const payload = {
    id,
    userId: data.userId ?? null,
    name: data.name || null,
    email: data.email || null,
    centre: data.centre || null,
    fromDate: data.fromDate,
    toDate: data.toDate,
    reason: String(data.reason || "").trim(),
    status: "pending",
    created_at: now,
    updated_at: now,
  };

  await leaveRef().doc(String(id)).set(payload);
  return toApi(String(id), payload);
};

const findByUser = async (userId) => {
  const snap = await leaveRef().where("userId", "==", userId).get();
  const rows = snap.docs.map((doc) => toApi(doc.id, doc.data()));
  return rows.sort(
    (a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0)
  );
};

const findByCentre = async (centre) => {
  const snap = await leaveRef().where("centre", "==", centre).get();
  return snap.docs.map((doc) => toApi(doc.id, doc.data()));
};

const findAll = async () => {
  const snap = await leaveRef().orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => toApi(doc.id, doc.data()));
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApi(doc.id, doc.data());
};

const updateStatus = async (id, status, meta = {}) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;

  const doc = await ref.get();
  if (!doc.exists) return null;

  const current = doc.data() || {};
  if (String(current.status || "pending").toLowerCase() !== "pending") {
    return toApi(doc.id, current);
  }

  const nextStatus = String(status || "").trim().toLowerCase();
  const patch = {
    status: nextStatus,
    updated_at: new Date(),
  };

  if (meta.reviewedBy != null) patch.reviewedBy = meta.reviewedBy;
  if (meta.reviewedByEmail != null) patch.reviewedByEmail = meta.reviewedByEmail;
  if (meta.reviewedAt != null) patch.reviewedAt = meta.reviewedAt;

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return toApi(updated.id, updated.data());
};

module.exports = {
  create,
  findByUser,
  findByCentre,
  findAll,
  findById,
  updateStatus,
};
