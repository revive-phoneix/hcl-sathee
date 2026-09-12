const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "leave_requests";

const toApi = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id ?? null,
    name: row.name ?? null,
    email: row.email ?? null,
    centre: row.centre ?? null,
    fromDate: row.from_date ?? null,
    toDate: row.to_date ?? null,
    reason: row.reason ?? "",
    status: row.status || "pending",
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const create = async (data) => {
  const payload = {
    user_id: data.userId ?? null,
    name: data.name || null,
    email: data.email || null,
    centre: data.centre || null,
    from_date: data.fromDate,
    to_date: data.toDate,
    reason: String(data.reason || "").trim(),
    status: "pending",
  };

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create leave request");
  return toApi(row);
};

const findByUser = async (userId) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  assertNoError(error, "Failed to load leave requests");
  return (data || []).map(toApi);
};

const findByCentre = async (centre) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("centre", centre);
  assertNoError(error, "Failed to load leave requests");
  return (data || []).map(toApi);
};

const findAll = async () => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  assertNoError(error, "Failed to load leave requests");
  return (data || []).map(toApi);
};

const findById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  assertNoError(error, "Failed to find leave request");
  return toApi(data);
};

const updateStatus = async (id, status, meta = {}) => {
  const { data: current, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load leave request");
  if (!current) return null;

  if (String(current.status || "pending").toLowerCase() !== "pending") {
    return toApi(current);
  }

  const patch = { status: String(status || "").trim().toLowerCase() };
  if (meta.reviewedBy != null) patch.reviewed_by = meta.reviewedBy;
  if (meta.reviewedByEmail != null) patch.reviewed_by_email = meta.reviewedByEmail;
  if (meta.reviewedAt != null) patch.reviewed_at = meta.reviewedAt;

  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  assertNoError(error, "Failed to update leave request");
  return toApi(row);
};

module.exports = {
  create,
  findByUser,
  findByCentre,
  findAll,
  findById,
  updateStatus,
};
