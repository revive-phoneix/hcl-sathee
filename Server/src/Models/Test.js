const { getDb } = require("../config/firebase");
const { toDate, toDateOnly, getNextId: nextId } = require("../Utils/firestoreHelpers");
const { getCanonicalCentreKey } = require("../Utils/centreMatch");

const COLLECTION = "tests";

const testsRef = () => getDb().collection(COLLECTION);
const getNextId = () => nextId(testsRef());

const toApiTest = (docId, data) => ({
  id: Number(docId) || docId,
  name: data.name,
  course: data.course,
  centre: data.centre ?? null,
  centreKey: data.centreKey ?? null,
  testNumber: data.testNumber,
  testDate: data.testDate,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findByCourse = async (course, centre = null) => {
  let query = testsRef().where("course", "==", String(course || "").trim().toUpperCase());
  if (centre) {
    const key = getCanonicalCentreKey(centre);
    if (key) query = query.where("centreKey", "==", key);
  }
  const snap = await query.get();
  return snap.docs
    .map((doc) => toApiTest(doc.id, doc.data()))
    .sort((a, b) => (a.testNumber || 0) - (b.testNumber || 0));
};

const findById = async (id) => {
  const doc = await testsRef().doc(String(id)).get();
  if (!doc.exists) return null;
  return toApiTest(doc.id, doc.data());
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
  const id = await getNextId();

  const payload = {
    id,
    name: name || `Test ${testNumber}`,
    course: courseKey,
    centre: centre || null,
    centreKey,
    testNumber,
    testDate: toDateOnly(testDate) || toDateOnly(now),
    createdBy,
    created_at: now,
    updated_at: now,
  };

  await testsRef().doc(String(id)).set(payload);
  return toApiTest(String(id), payload);
};

const removeById = async (id) => {
  const ref = testsRef().doc(String(id));
  const doc = await ref.get();
  if (!doc.exists) return 0;
  await ref.delete();
  return 1;
};

module.exports = { findByCourse, findById, getNextTestNumber, create, removeById };