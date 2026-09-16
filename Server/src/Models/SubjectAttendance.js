const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "subject_attendances";

const roundPct = (attended, total) => {
  if (!total || total <= 0) return 0;
  return Math.round((Number(attended) / Number(total)) * 1000) / 10;
};

const toApiAttendance = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    subject: row.subject,
    dailyAttendancePercentage: row.daily_attendance_percentage ?? 0,
    weeklyAttendancePercentage: row.weekly_attendance_percentage ?? 0,
    monthlyAttendancePercentage: row.monthly_attendance_percentage ?? 0,
    percentage: row.percentage ?? roundPct(row.classes_attended, row.total_classes),
    totalClasses: row.total_classes ?? 0,
    classesAttended: row.classes_attended ?? 0,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const findAll = async () => {
  const { data, error } = await getSupabase().from(TABLE).select("*");
  assertNoError(error, "Failed to list subject attendance");
  return (data || []).map(toApiAttendance);
};

const findByStudentId = async (studentId) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("student_id", Number(studentId) || studentId);
  assertNoError(error, "Failed to load student attendance");
  return (data || []).map(toApiAttendance);
};

const findByStudentAndSubject = async (studentId, subject) => {
  const subjectName = String(subject || "").trim();
  if (!subjectName) return null;

  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("student_id", Number(studentId) || studentId)
    .eq("subject", subjectName)
    .maybeSingle();
  assertNoError(error, "Failed to load student attendance");
  return toApiAttendance(data);
};

const create = async (data) => {
  const totalClasses = data.totalClasses ?? 0;
  const classesAttended = data.classesAttended ?? 0;
  const percentage =
    data.percentage != null ? Number(data.percentage) : roundPct(classesAttended, totalClasses);

  const payload = {
    student_id: data.studentId,
    subject: data.subject,
    daily_attendance_percentage: data.dailyAttendancePercentage ?? percentage,
    weekly_attendance_percentage: data.weeklyAttendancePercentage ?? percentage,
    monthly_attendance_percentage: data.monthlyAttendancePercentage ?? percentage,
    percentage,
    total_classes: totalClasses,
    classes_attended: classesAttended,
  };

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create subject attendance");
  return toApiAttendance(row);
};

const upsertTotals = async ({ studentId, subject, totalClasses, classesAttended, percentage }) => {
  const subjectName = String(subject || "").trim();
  const total = Math.max(0, Number(totalClasses) || 0);
  const attended = Math.max(0, Number(classesAttended) || 0);
  const pct =
    percentage != null && Number.isFinite(Number(percentage))
      ? Number(percentage)
      : roundPct(attended, total);

  const normalizedStudentId = Number(studentId) || studentId;
  const supabase = getSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("id")
    .eq("student_id", normalizedStudentId)
    .eq("subject", subjectName)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load subject attendance");

  const payload = {
    student_id: normalizedStudentId,
    subject: subjectName,
    total_classes: total,
    classes_attended: attended,
    percentage: pct,
    daily_attendance_percentage: pct,
    weekly_attendance_percentage: pct,
    monthly_attendance_percentage: pct,
  };
  if (existing) payload.id = existing.id;

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "student_id,subject" })
    .select("*")
    .single();
  assertNoError(error, "Failed to save subject attendance");
  return toApiAttendance(data);
};

/**
 * Patch just the daily/weekly/monthly percentage columns for an existing
 * student+subject row, leaving totalClasses/classesAttended/percentage
 * untouched. Used when the caller supplies explicit percentages instead of
 * raw class counts.
 */
const updatePercentages = async (studentId, subject, { daily, weekly, monthly }) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({
      daily_attendance_percentage: daily,
      weekly_attendance_percentage: weekly,
      monthly_attendance_percentage: monthly,
    })
    .eq("student_id", Number(studentId) || studentId)
    .eq("subject", String(subject || "").trim())
    .select("*")
    .maybeSingle();
  assertNoError(error, "Failed to update attendance percentages");
  return toApiAttendance(data);
};

module.exports = {
  findAll,
  findByStudentId,
  findByStudentAndSubject,
  create,
  upsertTotals,
  updatePercentages,
  roundPct,
};
