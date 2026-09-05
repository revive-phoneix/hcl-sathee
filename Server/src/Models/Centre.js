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

module.exports = {
  DEFAULT_CENTRES,
  normalizeName,
  findAll,
  create,
};
