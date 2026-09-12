// Pure date helpers shared by controllers and models. Historically this file
// also had Firestore-specific helpers (getNextId, findDocRefById) — those are
// gone now that Postgres/Supabase provides identity columns and direct
// primary-key lookups, so only the DB-agnostic date parsing survives here.

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const toDateOnly = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

module.exports = { toDate, toDateOnly };
