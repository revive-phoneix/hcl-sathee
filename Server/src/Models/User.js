const { getSupabase, assertNoError, UNIQUE_VIOLATION, paginateByCreatedAt } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "users";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const normalizeAvailableDays = (value) => {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(WEEKDAYS.map((d) => d.toLowerCase()));
  const seen = new Set();
  const days = [];

  for (const entry of value) {
    const raw = String(entry || "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!allowed.has(key) || seen.has(key)) continue;
    seen.add(key);
    const match = WEEKDAYS.find((d) => d.toLowerCase() === key);
    if (match) days.push(match);
  }

  return WEEKDAYS.filter((day) => days.includes(day));
};

const isMitraRole = (role = "") =>
  String(role || "").trim().toUpperCase() === "SATHEE MITRA";

const normalizeIsVishist = (role, value) => {
  if (!isMitraRole(role)) return null;
  return value === true || value === "true" || value === 1 || value === "1";
};

const toApiUser = (row) => {
  if (!row) return null;
  const user = {
    id: row.id,
    name: row.name,
    email: typeof row.email === "string" ? row.email.trim().toLowerCase() : row.email,
    password: row.password == null ? null : String(row.password),
    phone: row.phone ?? null,
    role: row.role,
    centre: row.centre ?? null,
    fcmTokens: Array.isArray(row.fcm_tokens) ? row.fcm_tokens : [],
    availableDays: normalizeAvailableDays(row.available_days),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };

  if (isMitraRole(row.role)) {
    user.isVishist = Boolean(normalizeIsVishist(row.role, row.is_vishist));
  }

  return user;
};

let isVishistBackfillDone = false;

/**
 * - Sathee Mitra missing is_vishist -> set false
 * - Non-Mitra with is_vishist set -> clear to null
 * One-time, idempotent, same intent as the old Firestore batch backfill.
 */
const backfillMissingIsVishist = async () => {
  if (isVishistBackfillDone) return;
  isVishistBackfillDone = true;

  try {
    const supabase = getSupabase();
    await supabase
      .from(TABLE)
      .update({ is_vishist: false })
      .ilike("role", "SATHEE MITRA")
      .is("is_vishist", null);
    await supabase
      .from(TABLE)
      .update({ is_vishist: null })
      .not("role", "ilike", "SATHEE MITRA")
      .not("is_vishist", "is", null);
  } catch (error) {
    console.error("isVishist backfill failed:", error);
    isVishistBackfillDone = false;
  }
};

const findAll = async ({ limit = 200, cursor } = {}) => {
  await backfillMissingIsVishist();
  const { rows, nextCursor } = await paginateByCreatedAt(TABLE, { limit, cursor });
  const users = rows.map(toApiUser);
  Object.defineProperty(users, "nextCursor", { value: nextCursor, enumerable: false });
  return users;
};

const findByEmail = async (email) => {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("email", normalized)
    .maybeSingle();
  assertNoError(error, "Failed to find user by email");
  return toApiUser(data);
};

const findById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  assertNoError(error, "Failed to find user");
  return toApiUser(data);
};

const findByPhone = async (phone) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("phone", phone.trim())
    .maybeSingle();
  assertNoError(error, "Failed to find user by phone");
  return toApiUser(data);
};

const duplicateErrorFor = (error) => {
  const msg = String(error?.message || "").toLowerCase();
  if (msg.includes("email")) {
    const e = new Error("Email already exists");
    e.code = "DUPLICATE_EMAIL";
    return e;
  }
  if (msg.includes("phone")) {
    const e = new Error("Phone number already exists");
    e.code = "DUPLICATE_PHONE";
    return e;
  }
  return null;
};

const create = async (data) => {
  const role = data.role;
  const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    password: data.password == null ? null : String(data.password),
    role,
    centre: data.centre ?? null,
    available_days: isMitraRole(role) ? normalizeAvailableDays(data.availableDays) : [],
  };

  if (isMitraRole(role)) {
    payload.is_vishist = Boolean(normalizeIsVishist(role, data.isVishist));
  }

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      const duplicate = duplicateErrorFor(error);
      if (duplicate) throw duplicate;
    }
    assertNoError(error, "Failed to create user");
  }

  return toApiUser(row);
};

const update = async (id, data) => {
  const { data: existing, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load user");
  if (!existing) return null;

  const nextRole = data.role != null ? data.role : existing.role;
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.email !== undefined) patch.email = data.email;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.password !== undefined) patch.password = data.password == null ? null : String(data.password);
  if (data.role !== undefined) patch.role = data.role;
  if (data.centre !== undefined) patch.centre = data.centre;

  if (Object.prototype.hasOwnProperty.call(data, "availableDays")) {
    patch.available_days = isMitraRole(nextRole) ? normalizeAvailableDays(data.availableDays) : [];
  }

  if (Object.prototype.hasOwnProperty.call(data, "isVishist") || data.role != null) {
    patch.is_vishist = isMitraRole(nextRole)
      ? Boolean(
          normalizeIsVishist(
            nextRole,
            Object.prototype.hasOwnProperty.call(data, "isVishist")
              ? data.isVishist
              : existing.is_vishist
          )
        )
      : null;
  }

  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      const duplicate = duplicateErrorFor(error);
      if (duplicate) throw duplicate;
    }
    assertNoError(error, "Failed to update user");
  }

  return toApiUser(row);
};

const destroy = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).delete().eq("id", id).select("id");
  assertNoError(error, "Failed to delete user");
  return data && data.length ? 1 : 0;
};

const addFcmToken = async (id, token) => {
  if (!token) return null;
  const { data: existing, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("fcm_tokens")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load user");
  if (!existing) return null;

  const tokens = new Set(existing.fcm_tokens || []);
  tokens.add(token);

  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .update({ fcm_tokens: [...tokens] })
    .eq("id", id)
    .select("*")
    .single();
  assertNoError(error, "Failed to save device token");
  return toApiUser(row);
};

const removeFcmToken = async (id, token) => {
  if (!token) return null;
  const { data: existing, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("fcm_tokens")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load user");
  if (!existing) return null;

  const tokens = (existing.fcm_tokens || []).filter((t) => t !== token);
  const { error } = await getSupabase().from(TABLE).update({ fcm_tokens: tokens }).eq("id", id);
  assertNoError(error, "Failed to remove device token");
};

/**
 * Set password reset OTP for a user. Resets attempts counter to 0.
 */
const setPasswordResetOtp = async (id, { otpHash, expiresAt }) => {
  const { error } = await getSupabase()
    .from(TABLE)
    .update({ otp_hash: otpHash || null, otp_expires_at: expiresAt || null, otp_attempts: 0 })
    .eq("id", id);
  assertNoError(error, "Failed to set password reset OTP");
};

/**
 * Get password reset OTP data for a user.
 */
const getPasswordResetOtp = async (id) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("otp_hash, otp_expires_at, otp_attempts")
    .eq("id", id)
    .maybeSingle();
  assertNoError(error, "Failed to load password reset OTP");
  if (!data) return null;
  return {
    otpHash: data.otp_hash || null,
    otpExpiresAt: data.otp_expires_at || null,
    otpAttempts: data.otp_attempts || 0,
  };
};

/**
 * Increment OTP attempt counter for a user.
 */
const incrementOtpAttempts = async (id) => {
  const { data: existing, error: fetchError } = await getSupabase()
    .from(TABLE)
    .select("otp_attempts")
    .eq("id", id)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load user");
  if (!existing) return null;

  const newAttempts = (existing.otp_attempts || 0) + 1;
  const { error } = await getSupabase().from(TABLE).update({ otp_attempts: newAttempts }).eq("id", id);
  assertNoError(error, "Failed to update OTP attempts");
  return newAttempts;
};

/**
 * Clear password reset OTP data for a user. Call after successful reset or
 * when max attempts exceeded.
 */
const clearPasswordResetOtp = async (id) => {
  const { error } = await getSupabase()
    .from(TABLE)
    .update({ otp_hash: null, otp_expires_at: null, otp_attempts: 0 })
    .eq("id", id);
  assertNoError(error, "Failed to clear password reset OTP");
};

module.exports = {
  WEEKDAYS,
  normalizeAvailableDays,
  normalizeIsVishist,
  findAll,
  findByEmail,
  findById,
  findByPhone,
  create,
  update,
  destroy,
  addFcmToken,
  removeFcmToken,
  setPasswordResetOtp,
  getPasswordResetOtp,
  incrementOtpAttempts,
  clearPasswordResetOtp,
  backfillMissingIsVishist,
};
