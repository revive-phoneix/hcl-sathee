const { getSupabase, assertNoError } = require("../config/supabase");
const { uploadToStorage } = require("../config/storage");
const path = require("path");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "vishist_attendances";

const uploadPhoto = async (file, vishistUserId, date) => {
  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
  const storagePath = `vishist-attendance/${vishistUserId}/${date}/${Date.now()}${safeExt}`;
  return uploadToStorage(storagePath, file.buffer, { contentType: file.mimetype || "image/jpeg" });
};

const toApiRecord = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    vishistUserId: row.vishist_user_id ?? null,
    vishistName: row.vishist_name ?? null,
    vishistEmail: row.vishist_email ?? null,
    centre: row.centre ?? null,
    subject: row.subject ?? null,
    topicTaught: row.topic_taught ?? null,
    photoUrl: row.photo_url ?? null,
    photoPath: row.photo_path ?? null,
    markedByUserId: row.marked_by_user_id ?? null,
    markedByName: row.marked_by_name ?? null,
    date: row.date ?? null,
    created_at: toDate(row.created_at),
    status: row.status || "pending",
    approvedByUserId: row.approved_by_user_id ?? null,
    approvedAt: toDate(row.approved_at),
  };
};

const create = async ({
  vishistUserId,
  vishistName,
  vishistEmail,
  centre,
  subject,
  topicTaught,
  date,
  file,
  markedByUserId,
  markedByName,
}) => {
  if (!vishistUserId || !subject || !topicTaught || !date) {
    throw new Error("vishistUserId, subject, topicTaught and date are required");
  }

  let photoUrl = null;
  let photoPath = null;
  if (file?.buffer?.length) {
    const uploaded = await uploadPhoto(file, vishistUserId, date);
    photoUrl = uploaded.url;
    photoPath = uploaded.storagePath;
  }

  const payload = {
    vishist_user_id: Number(vishistUserId) || vishistUserId,
    vishist_name: vishistName || null,
    vishist_email: vishistEmail || null,
    centre: centre || null,
    subject,
    topic_taught: topicTaught,
    photo_url: photoUrl,
    photo_path: photoPath,
    marked_by_user_id: markedByUserId ?? null,
    marked_by_name: markedByName || null,
    date,
    status: "pending",
  };

  const { data, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create vishist attendance");
  return toApiRecord(data);
};

const approve = async (recordId, approvedByUserId) => {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", recordId)
    .maybeSingle();
  assertNoError(fetchError, "Failed to find vishist attendance record");

  if (!existing) {
    const err = new Error("Vishist attendance record not found");
    err.status = 404;
    throw err;
  }
  if (existing.status === "approved") {
    const err = new Error("This attendance is already approved");
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: "approved", approved_by_user_id: approvedByUserId, approved_at: new Date().toISOString() })
    .eq("id", recordId)
    .select("*")
    .single();
  assertNoError(error, "Failed to approve vishist attendance");
  return toApiRecord(data);
};

const findByDate = async (date, centre = null, status = null) => {
  let query = getSupabase().from(TABLE).select("*").eq("date", date).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  assertNoError(error, "Failed to load vishist attendance");
  let rows = (data || []).map(toApiRecord);
  if (centre) {
    const { matchesCentre } = require("../Utils/centreMatch");
    rows = rows.filter((r) => matchesCentre(r.centre, centre));
  }
  return rows;
};

const findByDateRange = async (fromDate, toDateArg, centre = null, status = null) => {
  let query = getSupabase()
    .from(TABLE)
    .select("*")
    .gte("date", fromDate)
    .lte("date", toDateArg)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  assertNoError(error, "Failed to load vishist attendance");
  let rows = (data || []).map(toApiRecord);
  if (centre) {
    const { matchesCentre } = require("../Utils/centreMatch");
    rows = rows.filter((r) => matchesCentre(r.centre, centre));
  }
  return rows;
};

module.exports = { create, findByDate, findByDateRange, approve };
