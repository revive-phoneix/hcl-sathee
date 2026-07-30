const { getDb } = require("../config/firebase");
const { toDate } = require("../Utils/firestoreHelpers");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const COLLECTION = "schedules";

const schedulesRef = () => getDb().collection(COLLECTION);

const toApi = (docId, data = {}) => ({
  id: docId,
  centre: data.centre ?? null,
  centreKey: docId,
  rows: Array.isArray(data.rows) ? data.rows : [],
  name: data.name ?? null,
  lastFile: data.lastFile ?? null,
  monthCount: data.monthCount ?? null,
  rowCount: data.rowCount ?? null,
  updatedAt: toDate(data.updatedAt) || toDate(data.updated_at),
  updatedBy: data.updatedBy ?? null,
});

const findByCentreKey = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return null;
  const doc = await schedulesRef().doc(key).get();
  if (!doc.exists) return null;
  return toApi(doc.id, doc.data());
};

const upsert = async ({ centre, centreKey, rows, meta = {}, updatedBy = null }) => {
  const key = getCanonicalCentreKey(centreKey || centre);
  if (!key) throw new Error("Valid centre is required");

  const now = new Date();
  const payload = {
    centre: centre || null,
    centreKey: key,
    rows: Array.isArray(rows) ? rows : [],
    name: meta.name ?? meta.lastFile ?? null,
    lastFile: meta.lastFile ?? meta.name ?? null,
    monthCount: meta.monthCount ?? null,
    rowCount: meta.rowCount ?? (Array.isArray(rows) ? rows.length : 0),
    updatedAt: now,
    updatedBy: updatedBy || null,
  };

  await schedulesRef().doc(key).set(payload, { merge: true });
  return toApi(key, payload);
};

const remove = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return false;
  await schedulesRef().doc(key).delete();
  return true;
};

module.exports = {
  findByCentreKey,
  upsert,
  remove,
};
