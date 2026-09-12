const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "support_queries";

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

const toApiSupportQuery = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || "Untitled query",
    description: row.description || "",
    status: row.status || "Open",
    submittedBy: row.submitted_by || "Partner User",
    submittedByEmail: row.submitted_by_email || "",
    submittedByRole: row.submitted_by_role || "HCL Partner",
    centre: row.centre || null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
    replies: normalizeReplies(row.replies),
  };
};

const findAll = async () => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  assertNoError(error, "Failed to list support queries");
  return (data || []).map(toApiSupportQuery);
};

const findBySubmittedByEmail = async (email) => {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return [];

  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("submitted_by_email", normalized);
  assertNoError(error, "Failed to load support queries");
  return (data || []).map(toApiSupportQuery);
};

const findById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  assertNoError(error, "Failed to find support query");
  return toApiSupportQuery(data);
};

const create = async (data) => {
  const payload = {
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    status: data.status || "Open",
    submitted_by: String(data.submittedBy || "Partner User").trim(),
    submitted_by_email: String(data.submittedByEmail || "").trim(),
    submitted_by_role: String(data.submittedByRole || "HCL Partner").trim(),
    centre: data.centre || null,
    replies: normalizeReplies(data.replies),
  };

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create support query");
  return toApiSupportQuery(row);
};

const addReply = async (id, { adminName, message }) => {
  const { data: current, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load support query");
  if (!current) return null;

  const reply = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    adminName: String(adminName || "Admin").trim(),
    message: String(message || "").trim(),
    created_at: new Date(),
  };
  if (!reply.message) return null;

  const nextReplies = [...normalizeReplies(current.replies || []), reply];

  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .update({ replies: nextReplies, status: "Replied" })
    .eq("id", id)
    .select("*")
    .single();
  assertNoError(error, "Failed to add reply");
  return toApiSupportQuery(row);
};

module.exports = { findAll, findBySubmittedByEmail, findById, create, addReply };
