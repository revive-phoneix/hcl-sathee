const { getDb } = require("../config/firebase");
const { toDate, getNextId: nextId } = require("../Utils/firestoreHelpers");

const COLLECTION = "subjectAttendances";

const attendancesRef = () => getDb().collection(COLLECTION);
const getNextId = () => nextId(attendancesRef());

const toApiAttendance = (docId, data) => ({
  id: Number(docId) || docId,
  studentId: data.studentId,
  subject: data.subject,
  dailyAttendancePercentage: data.dailyAttendancePercentage ?? 0,
  weeklyAttendancePercentage: data.weeklyAttendancePercentage ?? 0,
  monthlyAttendancePercentage: data.monthlyAttendancePercentage ?? 0,
  totalClasses: data.totalClasses ?? 0,
  classesAttended: data.classesAttended ?? 0,
  created_at: toDate(data.created_at),
  updated_at: toDate(data.updated_at),
});

const findAll = async () => {
  const snap = await attendancesRef().get();
  return snap.docs.map((doc) => toApiAttendance(doc.id, doc.data()));
};

const findByStudentId = async (studentId) => {
  const snap = await attendancesRef()
    .where("studentId", "==", Number(studentId) || studentId)
    .get();
  return snap.docs.map((doc) => toApiAttendance(doc.id, doc.data()));
};

const create = async (data) => {
  const now = new Date();
  const id = await getNextId();
  const payload = {
    id,
    studentId: data.studentId,
    subject: data.subject,
    dailyAttendancePercentage: data.dailyAttendancePercentage ?? 0,
    weeklyAttendancePercentage: data.weeklyAttendancePercentage ?? 0,
    monthlyAttendancePercentage: data.monthlyAttendancePercentage ?? 0,
    totalClasses: data.totalClasses ?? 0,
    classesAttended: data.classesAttended ?? 0,
    created_at: now,
    updated_at: now,
  };

  await attendancesRef().doc(String(id)).set(payload);
  return toApiAttendance(String(id), payload);
};

module.exports = {
  findAll,
  findByStudentId,
  create,
};
