const { getSupabaseMirror } = require("../config/supabase");

/**
 * Best-effort mirror of a row into the given Supabase table, during the
 * Firebase+Supabase dual-write window. No-ops silently when the mirror isn't
 * configured yet; on failure it only warns — it must NEVER throw, since
 * Firestore stays the real source of truth and a broken/unset Supabase
 * project can never be allowed to affect the actual API response.
 */
const mirrorUpsert = async (table, row, conflictColumn = "id") => {
  const supabase = getSupabaseMirror();
  if (!supabase) return;
  try {
    const { error } = await supabase.from(table).upsert(row, { onConflict: conflictColumn });
    if (error) console.warn(`[supabase-mirror] upsert ${table} failed:`, error.message);
  } catch (err) {
    console.warn(`[supabase-mirror] upsert ${table} threw:`, err.message);
  }
};

/** Best-effort mirrored delete, matched by a single column (usually "id"). */
const mirrorDelete = async (table, column, value) => {
  const supabase = getSupabaseMirror();
  if (!supabase) return;
  try {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) console.warn(`[supabase-mirror] delete ${table} failed:`, error.message);
  } catch (err) {
    console.warn(`[supabase-mirror] delete ${table} threw:`, err.message);
  }
};

module.exports = { mirrorUpsert, mirrorDelete };
