const { getSupabase, assertNoError } = require("../config/supabase");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const TABLE = "centres";

/**
 * The 3 centres the platform shipped with. They behave as always-present
 * defaults even when the `centres` table has no rows for them.
 */
const DEFAULT_CENTRES = ["HCL RAJASTHAN", "HCL JHARKHAND", "HCL MADHYA PRADESH"];

/**
 * Normalize a free-text centre name into the same shape as the existing
 * centres (e.g. "hcl uttar pradesh" -> "HCL UTTAR PRADESH").
 *
 * Mirrors the intent of `normalizeCentreValue` in Utils/centreMatch.js
 * (trim + uppercase + strip stray punctuation) but keeps word spacing and
 * guarantees the leading "HCL " prefix. Returns "" when nothing usable is left.
 */
const normalizeName = (value = "") => {
  const base = value
    .toString()
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^HCL\b\s*/, "")
    .trim();

  if (!base) return "";
  return `HCL ${base}`;
};

const toApiCentre = (row) => ({
  id: row.id,
  name: row.name ?? "",
});

/**
 * All centres: the default 3 (always present) followed by any custom centres
 * stored in Postgres, ordered by creation time. A default is only listed once
 * even if it has also been persisted as a real row.
 */
const findAll = async () => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  assertNoError(error, "Failed to list centres");

  const stored = (data || []).map(toApiCentre);

  const storedKeys = new Set(stored.map((c) => getCanonicalCentreKey(c.name)));
  const defaults = DEFAULT_CENTRES.filter(
    (name) => !storedKeys.has(getCanonicalCentreKey(name))
  ).map((name) => ({ id: `default:${getCanonicalCentreKey(name)}`, name }));

  return [...defaults, ...stored];
};

/**
 * Create a new centre. Normalizes the name, rejects empty names and rejects
 * anything that fuzzy-matches an existing centre (default or custom).
 */
const create = async (name, createdBy) => {
  const normalized = normalizeName(name);
  if (!normalized) {
    const error = new Error("Centre name is required");
    error.code = "INVALID_CENTRE";
    throw error;
  }

  const key = getCanonicalCentreKey(normalized);
  const existing = await findAll();
  if (existing.some((c) => getCanonicalCentreKey(c.name) === key)) {
    const error = new Error("A centre with this name already exists");
    error.code = "DUPLICATE_CENTRE";
    throw error;
  }

  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({ name: normalized, created_by: createdBy ?? null })
    .select("*")
    .single();
  assertNoError(error, "Failed to create centre");

  return toApiCentre(data);
};

/**
 * Count how many rows in the tables we know carry a `centre` column
 * (`users`, `students`, `equipments`) are assigned to the given centre,
 * matched with the same fuzzy canonical key used everywhere else.
 */
const countUsageAcrossCollections = async (centreName) => {
  const supabase = getSupabase();
  const key = getCanonicalCentreKey(centreName);

  const [usersRes, studentsRes, equipmentRes] = await Promise.all([
    supabase.from("users").select("centre"),
    supabase.from("students").select("centre"),
    supabase.from("equipments").select("centre"),
  ]);
  assertNoError(usersRes.error, "Failed to count centre usage (users)");
  assertNoError(studentsRes.error, "Failed to count centre usage (students)");
  assertNoError(equipmentRes.error, "Failed to count centre usage (equipment)");

  const matchesCentre = (row) => getCanonicalCentreKey(row.centre) === key;

  return {
    users: (usersRes.data || []).filter(matchesCentre).length,
    students: (studentsRes.data || []).filter(matchesCentre).length,
    equipment: (equipmentRes.data || []).filter(matchesCentre).length,
  };
};

/**
 * Guard shared by `update` and `remove`: a centre may only be renamed or
 * deleted when it is NOT one of the shipped defaults AND has zero associated
 * users / students / equipment. Throws a coded error otherwise.
 */
const assertRemovable = async (centreName) => {
  if (
    DEFAULT_CENTRES.some(
      (d) => getCanonicalCentreKey(d) === getCanonicalCentreKey(centreName)
    )
  ) {
    const error = new Error("Default centres cannot be renamed or deleted");
    error.code = "DEFAULT_CENTRE_LOCKED";
    throw error;
  }

  const counts = await countUsageAcrossCollections(centreName);
  const total = counts.users + counts.students + counts.equipment;
  if (total > 0) {
    const parts = [];
    if (counts.students) parts.push(`${counts.students} student(s)`);
    if (counts.users) parts.push(`${counts.users} staff member(s)`);
    if (counts.equipment) parts.push(`${counts.equipment} equipment item(s)`);
    const error = new Error(
      `Cannot modify this centre — ${parts.join(", ")} still assigned to it. ` +
        `Reassign or remove that data first.`
    );
    error.code = "CENTRE_IN_USE";
    throw error;
  }
};

/**
 * Rename a custom centre. Does NOT cascade to existing records, so it is only
 * permitted while the centre is empty (see `assertRemovable`). Rejects blank
 * names and names that collide with another existing centre.
 */
const update = async (id, newName) => {
  const { data: existing, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load centre");
  if (!existing) {
    const error = new Error("Centre not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await assertRemovable(existing.name);

  const normalized = normalizeName(newName);
  if (!normalized) {
    const error = new Error("Centre name is required");
    error.code = "INVALID_CENTRE";
    throw error;
  }

  const key = getCanonicalCentreKey(normalized);
  const all = await findAll();
  const duplicate = all.some(
    (c) => String(c.id) !== String(id) && getCanonicalCentreKey(c.name) === key
  );
  if (duplicate) {
    const error = new Error("A centre with this name already exists");
    error.code = "DUPLICATE_CENTRE";
    throw error;
  }

  const { error } = await getSupabase().from(TABLE).update({ name: normalized }).eq("id", id);
  assertNoError(error, "Failed to rename centre");
  return toApiCentre({ id: existing.id, name: normalized });
};

/**
 * Delete a custom centre. Blocked for defaults and for any centre that still
 * has associated data (see `assertRemovable`).
 */
const remove = async (id) => {
  const { data: existing, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load centre");
  if (!existing) {
    const error = new Error("Centre not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await assertRemovable(existing.name);
  const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
  assertNoError(error, "Failed to delete centre");
  return { id };
};

module.exports = {
  DEFAULT_CENTRES,
  normalizeName,
  findAll,
  create,
  update,
  remove,
};
