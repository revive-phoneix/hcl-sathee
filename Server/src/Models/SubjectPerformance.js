const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "subject_performances";

const toApiPerformance = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    subject: row.subject,
    marks: row.marks,
    maxMarks: row.max_marks ?? 100,
    grade: row.grade ?? null,
    remarks: row.remarks ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const findAll = async () => {
  const { data, error } = await getSupabase().from(TABLE).select("*");
  assertNoError(error, "Failed to list subject performances");
  return (data || []).map(toApiPerformance);
};

const findByStudentId = async (studentId) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("student_id", Number(studentId) || studentId);
  assertNoError(error, "Failed to load student performance");
  return (data || []).map(toApiPerformance);
};

/**
 * Batched version of findByStudentId — one (or a few, chunked) query for
 * many students instead of one query per student. Returns a Map keyed by
 * studentId so callers can look up each student's rows in O(1).
 */
const findByStudentIds = async (studentIds = []) => {
  const uniqueIds = [...new Set(studentIds.filter((id) => id != null && id !== ""))];
  const byStudent = new Map(uniqueIds.map((id) => [String(id), []]));
  if (!uniqueIds.length) return byStudent;

  const CHUNK = 200;
  for (let i = 0; i < uniqueIds.length; i += CHUNK) {
    const chunk = uniqueIds.slice(i, i + CHUNK);
    const { data, error } = await getSupabase().from(TABLE).select("*").in("student_id", chunk);
    assertNoError(error, "Failed to load subject performances");
    for (const row of data || []) {
      const key = String(row.student_id);
      if (!byStudent.has(key)) byStudent.set(key, []);
      byStudent.get(key).push(toApiPerformance(row));
    }
  }

  return byStudent;
};

const create = async (data) => {
  const payload = {
    student_id: data.studentId,
    subject: data.subject,
    marks: data.marks,
    max_marks: data.maxMarks ?? 100,
    grade: data.grade ?? null,
    remarks: data.remarks ?? null,
  };

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create subject performance");
  return toApiPerformance(row);
};

module.exports = {
  findAll,
  findByStudentId,
  findByStudentIds,
  create,
};
