const { toDate, findDocRefById: findRef, getNextId: nextId } = require("../Utils/firestoreHelpers");
const { getDb } = require("../config/firebase");

const COLLECTION = "support_queries";

const supportQueriesRef = () => getDb().collection(COLLECTION);
const findDocRefById = (id) => findRef(supportQueriesRef(), id);
const getNextId = () => nextId(supportQueriesRef());

const normalizeReplies = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((reply) => reply && typeof reply === "object")
    .map((reply) => ({
      id: String(reply.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      adminName: String(reply.adminName || "Admin").trim(),
      message: String(reply.message || "").trim(),
      created_at: toDate(reply.created_at || new Date()),
    }))
    .filter((reply) => reply.message);
};

const toApiSupportQuery = (docId, data) => ({
  id: Number(docId) || docId,
  title: data.title || "Untitled query",
  description: data.description || "",
  status: data.status || "Open",
  submittedBy: data.submittedBy || "Partner User",
  submittedByEmail: data.submittedByEmail || "",
  submittedByRole: data.submittedByRole || "HCL Partner",
  centre: data.centre || null,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
  replies: normalizeReplies(data.replies),
});

const findAll = async () => {
  const snap = await supportQueriesRef().orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => toApiSupportQuery(doc.id, doc.data()));
};

const findById = async (id) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;
  const doc = await ref.get();
  return toApiSupportQuery(doc.id, doc.data());
};

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const payload = {
    id,
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    status: data.status || "Open",
    submittedBy: String(data.submittedBy || "Partner User").trim(),
    submittedByEmail: String(data.submittedByEmail || "").trim(),
    submittedByRole: String(data.submittedByRole || "HCL Partner").trim(),
    centre: data.centre || null,
    replies: normalizeReplies(data.replies),
    created_at: now,
    updated_at: now,
  };

  await supportQueriesRef().doc(String(id)).set(payload);
  return toApiSupportQuery(String(id), payload);
};

const addReply = async (id, { adminName, message }) => {
  const ref = await findDocRefById(id);
  if (!ref) return null;

  const existing = await ref.get();
  const current = existing.data() || {};
  const nextReplies = normalizeReplies(current.replies || []);
  const reply = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    adminName: String(adminName || "Admin").trim(),
    message: String(message || "").trim(),
    created_at: new Date(),
  };

  if (!reply.message) return null;

  const updated = {
    replies: [...nextReplies, reply],
    status: "Replied",
    updated_at: new Date(),
  };

  await ref.update(updated);
  const doc = await ref.get();
  return toApiSupportQuery(doc.id, doc.data());
};

module.exports = { findAll, findById, create, addReply };
