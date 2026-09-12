const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "test_subject_marks";

const roundPct = (obtained, total) => {
  if (!total || total <= 0) return null;
  return Math.round((Number(obtained) / Number(total)) * 1000) / 10;
};

const normalizeTestType = (testType) => String(testType || "performance").trim().toLowerCase();

const toApiMark = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    testId: row.test_id,
    testType: row.test_type ?? "performance",
    studentId: row.student_id,
    course: row.course ?? null,
    centre: row.centre ?? null,
    subject: row.subject,
    marksObtained: row.marks_obtained ?? 0,
    totalMarks: row.total_marks ?? 0,
    subjectPercentage: row.subject_percentage ?? roundPct(row.marks_obtained, row.total_marks),
    answerSheetUrl: row.answer_sheet_url ?? null,
    answerSheetPath: row.answer_sheet_path ?? null,
    source: row.source ?? "manual",
    verifiedByMitra: Boolean(row.verified_by_mitra),
    enteredBy: row.entered_by ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const findByTest = async (testId) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("test_id", testId);
  assertNoError(error, "Failed to load test marks");
  return (data || []).map(toApiMark);
};

const findByStudentAndTest = async (studentId, testId) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", Number(studentId) || studentId);
  assertNoError(error, "Failed to load student test marks");
  return (data || []).map(toApiMark);
};

const findByStudent = async (studentId) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("student_id", Number(studentId) || studentId);
  assertNoError(error, "Failed to load student marks");
  return (data || []).map(toApiMark);
};

const findByCourse = async (course, centre = null) => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("course", String(course || "").trim().toUpperCase());
  assertNoError(error, "Failed to load course marks");
  let rows = (data || []).map(toApiMark);
  if (centre) {
    const { matchesCentre } = require("../Utils/centreMatch");
    rows = rows.filter((r) => matchesCentre(r.centre, centre));
  }
  return rows;
};

const deleteByTestId = async (testId) => {
  const { data, error } = await getSupabase().from(TABLE).delete().eq("test_id", testId).select("id");
  assertNoError(error, "Failed to delete test marks");
  return data ? data.length : 0;
};

const upsert = async ({
  testId,
  testType = "performance",
  studentId,
  course = null,
  centre = null,
  subject,
  marksObtained,
  totalMarks,
  subjectPercentage = null, // Optional pre-calculated percentage
  answerSheetUrl = null,
  answerSheetPath = null,
  source = "manual",
  verifiedByMitra = false,
  enteredBy = null,
}) => {
  const subjectName = String(subject || "").trim();
  if (!testId || !studentId || !subjectName) {
    throw new Error("testId, studentId, and subject are required");
  }

  const normalizedTestType = normalizeTestType(testType);
  const normalizedStudentId = Number(studentId) || studentId;
  const supabase = getSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", normalizedStudentId)
    .eq("test_type", normalizedTestType)
    .eq("subject", subjectName)
    .maybeSingle();
  assertNoError(fetchError, "Failed to load existing test mark");

  const obtained = Math.max(0, Number(marksObtained) || 0);
  const total = Math.max(0, Number(totalMarks) || 0);

  const payload = {
    test_id: testId,
    test_type: normalizedTestType,
    student_id: normalizedStudentId,
    course: course || existing?.course || null,
    centre: centre || existing?.centre || null,
    subject: subjectName,
    marks_obtained: obtained,
    total_marks: total,
    subject_percentage: subjectPercentage ?? roundPct(obtained, total), // Use provided or calculate
    answer_sheet_url: answerSheetUrl ?? existing?.answer_sheet_url ?? null,
    answer_sheet_path: answerSheetPath ?? existing?.answer_sheet_path ?? null,
    source,
    verified_by_mitra: Boolean(verifiedByMitra),
    entered_by: enteredBy ?? existing?.entered_by ?? null,
  };
  if (existing) payload.id = existing.id;

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "test_id,student_id,test_type,subject" })
    .select("*")
    .single();
  assertNoError(error, "Failed to save test mark");
  return toApiMark(data);
};

module.exports = {
  findByTest,
  findByStudentAndTest,
  findByStudent,
  upsert,
  roundPct,
  findByCourse,
  deleteByTestId,
};
