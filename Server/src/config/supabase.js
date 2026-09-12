const { createClient } = require("@supabase/supabase-js");

let client = null;

/**
 * Initializes the Supabase client (service_role key — server-only, bypasses
 * Row Level Security). Call once at boot, same as the old initFirebase().
 */
const initSupabase = () => {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env " +
        "(see Server/.env.example and Server/supabase/schema.sql)."
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("✅ Supabase Connected Successfully");
  return client;
};

const getSupabase = () => {
  if (!client) {
    throw new Error("Supabase not initialized. Call initSupabase() first.");
  }
  return client;
};

/**
 * Throws a friendly error for an unexpected Postgres/PostgREST error, or
 * returns quietly if `error` is null. Every model funnels writes/reads
 * through this so failures surface with useful context instead of a bare
 * PostgrestError object.
 */
const assertNoError = (error, context) => {
  if (!error) return;
  const err = new Error(`${context}: ${error.message || "database error"}`);
  err.cause = error;
  err.code = error.code;
  throw err;
};

/** Postgres unique_violation error code, raised on duplicate email/phone/etc. */
const UNIQUE_VIOLATION = "23505";

/**
 * Keyset pagination helper shared by every model that used to paginate a
 * Firestore query with `.orderBy("created_at", "desc").limit(n).startAfter(cursorDoc)`.
 * Orders by (created_at desc, id desc) — the id tiebreak keeps ordering stable
 * even when two rows share a created_at timestamp — and resumes exactly after
 * the row named by `cursor` (that row's id), matching the old cursor semantics.
 *
 * Returns { rows, nextCursor } where `rows` are raw table rows (map them with
 * the model's own toApiXxx) and `nextCursor` is the id to pass back in for the
 * next page, or null when this was the last page.
 */
const paginateByCreatedAt = async (table, { limit = 200, cursor } = {}) => {
  const supabase = getSupabase();
  const pageLimit = Math.min(Math.max(Number(limit) || 200, 1), 200);

  let query = supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageLimit);

  if (cursor) {
    const { data: cursorRow } = await supabase
      .from(table)
      .select("id, created_at")
      .eq("id", cursor)
      .maybeSingle();
    if (cursorRow) {
      query = query.or(
        `created_at.lt.${cursorRow.created_at},and(created_at.eq.${cursorRow.created_at},id.lt.${cursorRow.id})`
      );
    }
  }

  const { data, error } = await query;
  assertNoError(error, `Failed to list ${table}`);
  const rows = data || [];
  return { rows, nextCursor: rows.length === pageLimit ? rows.at(-1).id : null };
};

module.exports = {
  initSupabase,
  getSupabase,
  assertNoError,
  UNIQUE_VIOLATION,
  paginateByCreatedAt,
};
