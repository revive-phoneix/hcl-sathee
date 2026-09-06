const { getDb } = require("../config/firebase");
const { getNextId: nextId } = require("../Utils/firestoreHelpers");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const COLLECTION = "centres";

const centresRef = () => getDb().collection(COLLECTION);
const getNextId = () => nextId(centresRef());

/**
 * The 3 centres the platform shipped with. They behave as always-present
 * defaults even when the Firestore `centres` collection has no docs for them.
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

const toApiCentre = (docId, data) => ({
  id: Number(docId) || docId,
  name: data.name ?? "",
});

/**
 * All centres: the default 3 (always present) followed by any custom centres
 * stored in Firestore, ordered by creation time. A default is only listed once
 * even if it has also been persisted as a real document.
 */
const findAll = async () => {
  const snap = await centresRef().orderBy("createdAt", "asc").get();
  const stored = snap.docs.map((doc) => toApiCentre(doc.id, doc.data()));

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

  const id = await getNextId();
  const payload = {
    id,
    name: normalized,
    createdAt: new Date(),
    createdBy: createdBy ?? null,
  };

  await centresRef().doc(String(id)).set(payload);
  return toApiCentre(String(id), payload);
};

/**
 * Count how many docs in the collections we know carry a `centre` field
 * (`users`, `students`, `equipments`) are assigned to the given centre,
 * matched with the same fuzzy canonical key used everywhere else.
 */
const countUsageAcrossCollections = async (centreName) => {
  const db = getDb();
  const key = getCanonicalCentreKey(centreName);

  const [usersSnap, studentsSnap, equipmentSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("students").get(),
    db.collection("equipments").get(),
  ]);

  const matchesCentre = (doc) => getCanonicalCentreKey(doc.data().centre) === key;

  return {
    users: usersSnap.docs.filter(matchesCentre).length,
    students: studentsSnap.docs.filter(matchesCentre).length,
    equipment: equipmentSnap.docs.filter(matchesCentre).length,
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
  const doc = await centresRef().doc(String(id)).get();
  if (!doc.exists) {
    const error = new Error("Centre not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await assertRemovable(doc.data().name);

  const normalized = normalizeName(newName);
  if (!normalized) {
    const error = new Error("Centre name is required");
    error.code = "INVALID_CENTRE";
    throw error;
  }

  const key = getCanonicalCentreKey(normalized);
  const existing = await findAll();
  const duplicate = existing.some(
    (c) => String(c.id) !== String(id) && getCanonicalCentreKey(c.name) === key
  );
  if (duplicate) {
    const error = new Error("A centre with this name already exists");
    error.code = "DUPLICATE_CENTRE";
    throw error;
  }

  await centresRef()
    .doc(String(id))
    .update({ name: normalized, updatedAt: new Date() });
  return toApiCentre(String(id), { name: normalized });
};

/**
 * Delete a custom centre. Blocked for defaults and for any centre that still
 * has associated data (see `assertRemovable`).
 */
const remove = async (id) => {
  const doc = await centresRef().doc(String(id)).get();
  if (!doc.exists) {
    const error = new Error("Centre not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await assertRemovable(doc.data().name);
  await centresRef().doc(String(id)).delete();
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
