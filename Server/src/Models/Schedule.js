const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const TABLE = "schedules";

const toApi = (row) => {
  if (!row) return null;
  return {
    id: row.centre_key,
    centre: row.centre ?? null,
    centreKey: row.centre_key,
    rows: Array.isArray(row.rows) ? row.rows : [],
    name: row.name ?? null,
    lastFile: row.last_file ?? null,
    monthCount: row.month_count ?? null,
    rowCount: row.row_count ?? null,
    updatedAt: toDate(row.updated_at),
    updatedBy: row.updated_by ?? null,
  };
};

const findByCentreKey = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return null;
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("centre_key", key).maybeSingle();
  assertNoError(error, "Failed to load schedule");
  return toApi(data);
};

const upsert = async ({ centre, centreKey, rows, meta = {}, updatedBy = null }) => {
  const key = getCanonicalCentreKey(centreKey || centre);
  if (!key) throw new Error("Valid centre is required");

  const payload = {
    centre_key: key,
    centre: centre || null,
    rows: Array.isArray(rows) ? rows : [],
    name: meta.name ?? meta.lastFile ?? null,
    last_file: meta.lastFile ?? meta.name ?? null,
    month_count: meta.monthCount ?? null,
    row_count: meta.rowCount ?? (Array.isArray(rows) ? rows.length : 0),
    updated_at: new Date().toISOString(),
    updated_by: updatedBy || null,
  };

  const { data, error } = await getSupabase()
    .from(TABLE)
    .upsert(payload, { onConflict: "centre_key" })
    .select("*")
    .single();
  assertNoError(error, "Failed to save schedule");
  return toApi(data);
};

const remove = async (centreKey) => {
  const key = getCanonicalCentreKey(centreKey);
  if (!key) return false;
  const { error } = await getSupabase().from(TABLE).delete().eq("centre_key", key);
  assertNoError(error, "Failed to delete schedule");
  return true;
};

module.exports = {
  findByCentreKey,
  upsert,
  remove,
};
