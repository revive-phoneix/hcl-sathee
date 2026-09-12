const path = require("path");
const { getSupabase, assertNoError } = require("../config/supabase");
const { uploadToStorage } = require("../config/storage");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "mitra_attendances";
const MAX_INLINE_BYTES = 700 * 1024;

const resolvePercentage = (value, fallback = 0) => {
  if (value != null && value !== "" && Number.isFinite(Number(value))) {
    return Math.max(0, Math.min(100, Number(value)));
  }
  return fallback;
};

const resolveAttendancePercentages = (data = {}, fallback = {}) => {
  const dailyFallback = resolvePercentage(fallback.dailyAttendancePercentage, 100);
  const weeklyFallback = resolvePercentage(fallback.weeklyAttendancePercentage, dailyFallback);
  const monthlyFallback = resolvePercentage(fallback.monthlyAttendancePercentage, weeklyFallback);

  return {
    dailyAttendancePercentage: resolvePercentage(data.dailyAttendancePercentage, dailyFallback),
    weeklyAttendancePercentage: resolvePercentage(data.weeklyAttendancePercentage, weeklyFallback),
    monthlyAttendancePercentage: resolvePercentage(data.monthlyAttendancePercentage, monthlyFallback),
  };
};

const toApiRecord = (row) => {
  if (!row) return null;
  const percentages = resolveAttendancePercentages({
    dailyAttendancePercentage: row.daily_attendance_percentage,
    weeklyAttendancePercentage: row.weekly_attendance_percentage,
    monthlyAttendancePercentage: row.monthly_attendance_percentage,
  });

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? null,
    email: row.email ?? null,
    centre: row.centre ?? null,
    centreId: row.centre_id ?? null,
    date: row.date,
    arrivalPhotoUrl: row.arrival_photo_url ?? null,
    arrivalTime: toDate(row.arrival_time),
    departurePhotoUrl: row.departure_photo_url ?? null,
    departureTime: toDate(row.departure_time),
    approved: Boolean(row.approved),
    approvedBy: row.approved_by ?? null,
    approvedAt: toDate(row.approved_at),
    dailyAttendancePercentage: percentages.dailyAttendancePercentage,
    weeklyAttendancePercentage: percentages.weeklyAttendancePercentage,
    monthlyAttendancePercentage: percentages.monthlyAttendancePercentage,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const APPROVAL_WINDOW_HOURS = 24;

const approveAttendance = async (userId, date, approvedBy) => {
  const supabase = getSupabase();
  const { data: row, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load attendance record");

  if (!row) {
    const err = new Error("Attendance record not found");
    err.status = 404;
    throw err;
  }
  if (!row.arrival_time) {
    const err = new Error("Cannot approve attendance with no arrival record");
    err.status = 400;
    throw err;
  }
  if (row.approved) {
    const err = new Error("This attendance is already approved");
    err.status = 400;
    throw err;
  }

  const arrival = toDate(row.arrival_time);
  const hoursSince = (Date.now() - arrival.getTime()) / (1000 * 60 * 60);
  if (hoursSince > APPROVAL_WINDOW_HOURS) {
    const err = new Error("Approval window has expired (24 hours)");
    err.status = 400;
    throw err;
  }

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update({ approved: true, approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq("id", row.id)
    .select("*")
    .single();
  assertNoError(error, "Failed to approve attendance");
  return toApiRecord(updated);
};

const findByDate = async (date) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("date", date);
  assertNoError(error, "Failed to load attendance");
  return (data || []).map(toApiRecord);
};

const findByDateRange = async (fromDate, toDateArg) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .gte("date", fromDate)
    .lte("date", toDateArg);
  assertNoError(error, "Failed to load attendance");
  return (data || []).map(toApiRecord);
};

const findByUserAndDate = async (userId, date) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  assertNoError(error, "Failed to load attendance");
  return toApiRecord(data);
};

const toInlinePhoto = (file) => {
  if (!file?.buffer?.length) {
    throw new Error("Photo file is missing or empty");
  }
  if (file.buffer.length > MAX_INLINE_BYTES) {
    throw new Error(
      "Photo is too large for fallback storage (max ~700 KB). Enable Supabase Storage or use a smaller image."
    );
  }
  const contentType = file.mimetype || "image/jpeg";
  return {
    url: `data:${contentType};base64,${file.buffer.toString("base64")}`,
    storagePath: null,
  };
};

const uploadPhoto = async (file, userId, date, type) => {
  if (!file?.buffer?.length) {
    throw new Error("Photo file is missing or empty");
  }

  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
  const storagePath = `mitra-attendance/${userId}/${date}/${type}-${Date.now()}${safeExt}`;

  try {
    return await uploadToStorage(storagePath, file.buffer, {
      contentType: file.mimetype || "image/jpeg",
    });
  } catch (storageErr) {
    console.error("Supabase Storage upload failed, using inline fallback:", storageErr?.message || storageErr);
    try {
      return toInlinePhoto(file);
    } catch (inlineErr) {
      throw new Error(
        `Photo upload failed: ${storageErr.message || "storage error"}. ${inlineErr.message}`
      );
    }
  }
};

const upsertCheckIn = async ({
  userId,
  name,
  email = null,
  centre,
  centreId = null,
  date,
  type,
  file,
  dailyAttendancePercentage = null,
  weeklyAttendancePercentage = null,
  monthlyAttendancePercentage = null,
}) => {
  const supabase = getSupabase();
  const normalizedUserId = Number(userId) || userId;

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", normalizedUserId)
    .eq("date", date)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load attendance record");

  const { url, storagePath } = await uploadPhoto(file, userId, date, type);

  const percentages = resolveAttendancePercentages(
    { dailyAttendancePercentage, weeklyAttendancePercentage, monthlyAttendancePercentage },
    {
      dailyAttendancePercentage: existing?.daily_attendance_percentage,
      weeklyAttendancePercentage: existing?.weekly_attendance_percentage,
      monthlyAttendancePercentage: existing?.monthly_attendance_percentage,
    }
  );

  const patch =
    type === "arrival"
      ? {
          arrival_photo_url: url,
          arrival_photo_path: storagePath,
          arrival_time: new Date().toISOString(),
          name: name || existing?.name || null,
          email: email || existing?.email || null,
          centre: centre || existing?.centre || null,
        }
      : {
          departure_photo_url: url,
          departure_photo_path: storagePath,
          departure_time: new Date().toISOString(),
          name: name || existing?.name || null,
          email: email || existing?.email || null,
          centre: centre || existing?.centre || null,
        };

  const payload = {
    user_id: normalizedUserId,
    date,
    centre_id: centreId || existing?.centre_id || null,
    ...patch,
    daily_attendance_percentage: percentages.dailyAttendancePercentage,
    weekly_attendance_percentage: percentages.weeklyAttendancePercentage,
    monthly_attendance_percentage: percentages.monthlyAttendancePercentage,
  };
  if (existing) payload.id = existing.id;

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "user_id,date" })
    .select("*")
    .single();
  assertNoError(error, "Failed to save attendance record");
  return toApiRecord(data);
};

module.exports = {
  findByDate,
  findByDateRange,
  findByUserAndDate,
  upsertCheckIn,
  resolvePercentage,
  resolveAttendancePercentages,
  approveAttendance,
};
