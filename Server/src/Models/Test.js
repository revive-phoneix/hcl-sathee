const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate, toDateOnly } = require("../Utils/firestoreHelpers");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const TABLE = "tests";

const toApiTest = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    course: row.course,
    centre: row.centre ?? null,
    centreKey: row.centre_key ?? null,
    testNumber: row.test_number,
    testDate: row.test_date,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const findByCourse = async (course, centre = null) => {
  let query = getSupabase()
    .from(TABLE)
    .select("*")
    .eq("course", String(course || "").trim().toUpperCase());
  if (centre) {
    const key = getCanonicalCentreKey(centre);
    if (key) query = query.eq("centre_key", key);
  }
  const { data, error } = await query;
  assertNoError(error, "Failed to list tests");
  return (data || [])
    .map(toApiTest)
    .sort((a, b) => (a.testNumber || 0) - (b.testNumber || 0));
};

const findById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  assertNoError(error, "Failed to find test");
  return toApiTest(data);
};

const getNextTestNumber = async (course, centre) => {
  const existing = await findByCourse(course, centre);
  return existing.length ? Math.max(...existing.map((t) => t.testNumber || 0)) + 1 : 1;
};

const create = async ({ name, course, centre, testDate, createdBy = null }) => {
  const courseKey = String(course || "").trim().toUpperCase();
  if (!courseKey) throw new Error("course is required");

  const centreKey = getCanonicalCentreKey(centre) || null;
  const testNumber = await getNextTestNumber(courseKey, centre);
  const now = new Date();

  const payload = {
    name: name || `Test ${testNumber}`,
    course: courseKey,
    centre: centre || null,
    centre_key: centreKey,
    test_number: testNumber,
    test_date: toDateOnly(testDate) || toDateOnly(now),
    created_by: createdBy,
  };

  const { data, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create test");
  return toApiTest(data);
};

const removeById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).delete().eq("id", id).select("id");
  assertNoError(error, "Failed to delete test");
  return data && data.length ? 1 : 0;
};

module.exports = { findByCourse, findById, getNextTestNumber, create, removeById };
