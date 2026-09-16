const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate, toDateOnly } = require("../Utils/firestoreHelpers");

const TABLE = "daily_subject_attendances";

const STATUS = {
  present: "present",
  absent: "absent",
};

const normalizeStatus = (status) => {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  return STATUS[key] || STATUS.absent;
};

const slugPart = (value, fallback = "na") => {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
};

const toApiLog = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    name: row.name ?? null,
    centre: row.centre ?? null,
    course: row.course ?? null,
    subject: row.subject,
    topic: row.topic ?? null,
    date: row.date,
    time: row.time ?? "",
    status: normalizeStatus(row.status),
    photoUrl: row.photo_url ?? null,
    photoPath: row.photo_path ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const filterByCentre = (rows, centre) => {
  if (!centre) return rows;
  const { matchesCentre } = require("../Utils/centreMatch");
  return rows.filter((row) => matchesCentre(row.centre, centre));
};

const findByDateSubjectTime = async ({ date, subject, time = "", centre = null }) => {
  const dateOnly = toDateOnly(date);
  if (!dateOnly || !subject) return [];

  let query = getSupabase()
    .from(TABLE)
    .select("*")
    .eq("date", dateOnly)
    .eq("subject", String(subject).trim());

  const timeKey = String(time || "").trim();
  if (timeKey) query = query.eq("time", timeKey);

  const { data, error } = await query;
  assertNoError(error, "Failed to load daily subject attendance");
  return filterByCentre((data || []).map(toApiLog), centre);
};

const findByDate = async (date, centre = null) => {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return [];

  const { data, error } = await getSupabase().from(TABLE).select("*").eq("date", dateOnly);
  assertNoError(error, "Failed to load daily subject attendance");
  return filterByCentre((data || []).map(toApiLog), centre);
};

const findByDateRange = async (fromDate, toDateArg, centre = null) => {
  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDateArg);
  if (!from || !to) return [];

  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .gte("date", from)
    .lte("date", to);
  assertNoError(error, "Failed to load daily subject attendance");
  return filterByCentre((data || []).map(toApiLog), centre);
};

const findByStudentAndSubject = async (studentId, subject) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("student_id", Number(studentId) || studentId)
    .eq("subject", String(subject).trim());
  assertNoError(error, "Failed to load student attendance");
  return (data || []).map(toApiLog);
};

const findByStudentId = async (studentId) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("student_id", Number(studentId) || studentId);
  assertNoError(error, "Failed to load student attendance");
  return (data || []).map(toApiLog);
};

const upsert = async ({
  studentId,
  name = null,
  centre = null,
  course = null,
  subject,
  date,
  time = "",
  topic = null,
  status,
  photoUrl = null,
  photoPath = null,
}) => {
  const dateOnly = toDateOnly(date);
  if (!studentId || !subject || !dateOnly) {
    throw new Error("studentId, subject, and date are required");
  }

  const subjectName = String(subject).trim();
  const timeKey = String(time || "").trim();
  const normalizedStudentId = Number(studentId) || studentId;
  const supabase = getSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("student_id", normalizedStudentId)
    .eq("subject", subjectName)
    .eq("date", dateOnly)
    .eq("time", timeKey)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load existing attendance record");

  const payload = {
    student_id: normalizedStudentId,
    name: name || existing?.name || null,
    centre: centre || existing?.centre || null,
    course: course || existing?.course || null,
    subject: subjectName,
    topic: topic || existing?.topic || null,
    date: dateOnly,
    time: timeKey,
    status: normalizeStatus(status),
    photo_url: photoUrl ?? existing?.photo_url ?? null,
    photo_path: photoPath ?? existing?.photo_path ?? null,
  };
  if (existing) payload.id = existing.id;

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "student_id,subject,date,time" })
    .select("*")
    .single();
  assertNoError(error, "Failed to save attendance record");
  return toApiLog(data);
};

module.exports = {
  STATUS,
  normalizeStatus,
  slugPart,
  findByDateSubjectTime,
  findByStudentAndSubject,
  findByStudentId,
  upsert,
  findByDate,
  findByDateRange,
};
