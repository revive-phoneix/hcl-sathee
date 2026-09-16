const { getSupabase, assertNoError, paginateByCreatedAt } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "students";

const parseObjectField = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const parseSubjectsField = (value) => {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .filter((item) => typeof item === "string" && item.trim())
          .map((item) => item.trim())
      ),
    ];
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return parseSubjectsField(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
};

const toApiStudent = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    enrollmentNo: row.enrollment_no ?? null,
    name: row.name,
    gender: row.gender,
    email: typeof row.email === "string" ? row.email.trim().toLowerCase() : row.email,
    phone: row.phone ?? null,
    centre: row.centre ?? null,
    course: row.course ?? null,
    category: row.category ?? null,
    address: row.address ?? null,
    parents: parseObjectField(row.parents),
    subjects: parseSubjectsField(row.subjects),
    marks: parseObjectField(row.marks),
    attendance: parseObjectField(row.attendance),
    qualifications: parseObjectField(row.qualifications),
    avatarColor: row.avatar_color ?? null,
    initials: row.initials ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const findAll = async ({ limit = 200, cursor } = {}) => {
  const { rows, nextCursor } = await paginateByCreatedAt(TABLE, { limit, cursor });
  const students = rows.map(toApiStudent);
  Object.defineProperty(students, "nextCursor", { value: nextCursor, enumerable: false });
  return students;
};

const findById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  assertNoError(error, "Failed to find student");
  return toApiStudent(data);
};

const findByIds = async (ids = []) => {
  const uniqueIds = [
    ...new Set(ids.filter((id) => id != null && id !== "").map((id) => String(id))),
  ];
  if (!uniqueIds.length) return [];

  const studentsById = new Map();
  const CHUNK = 200;
  for (let index = 0; index < uniqueIds.length; index += CHUNK) {
    const chunk = uniqueIds.slice(index, index + CHUNK);
    const { data, error } = await getSupabase().from(TABLE).select("*").in("id", chunk);
    assertNoError(error, "Failed to find students");
    for (const row of data || []) {
      studentsById.set(String(row.id), toApiStudent(row));
    }
  }

  return uniqueIds.map((id) => studentsById.get(String(id))).filter(Boolean);
};

const findByEmail = async (email) => {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("email", normalized)
    .maybeSingle();
  assertNoError(error, "Failed to find student by email");
  return toApiStudent(data);
};

const create = async (data) => {
  const payload = {
    student_id: data.studentId,
    enrollment_no: data.enrollmentNo ?? null,
    name: data.name,
    gender: data.gender,
    email: data.email,
    phone: data.phone ?? null,
    centre: data.centre ?? null,
    course: data.course ?? null,
    category: data.category ?? null,
    address: data.address ?? null,
    parents: parseObjectField(data.parents),
    subjects: parseSubjectsField(data.subjects),
    marks: parseObjectField(data.marks),
    attendance: parseObjectField(data.attendance),
    qualifications: parseObjectField(data.qualifications),
    avatar_color: data.avatarColor ?? null,
    initials: data.initials ?? null,
  };

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create student");
  return toApiStudent(row);
};

const update = async (id, data) => {
  const patch = {};
  if (data.studentId !== undefined) patch.student_id = data.studentId;
  if (data.enrollmentNo !== undefined) patch.enrollment_no = data.enrollmentNo;
  if (data.name !== undefined) patch.name = data.name;
  if (data.gender !== undefined) patch.gender = data.gender;
  if (data.email !== undefined) patch.email = data.email;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.centre !== undefined) patch.centre = data.centre;
  if (data.course !== undefined) patch.course = data.course;
  if (data.category !== undefined) patch.category = data.category;
  if (data.address !== undefined) patch.address = data.address;
  if (data.avatarColor !== undefined) patch.avatar_color = data.avatarColor;
  if (data.initials !== undefined) patch.initials = data.initials;
  if (data.parents !== undefined) patch.parents = parseObjectField(data.parents);
  if (data.subjects !== undefined) patch.subjects = parseSubjectsField(data.subjects);
  if (data.marks !== undefined) patch.marks = parseObjectField(data.marks);
  if (data.attendance !== undefined) patch.attendance = parseObjectField(data.attendance);
  if (data.qualifications !== undefined) patch.qualifications = parseObjectField(data.qualifications);

  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  assertNoError(error, "Failed to update student");
  return toApiStudent(row);
};

const destroy = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).delete().eq("id", id).select("id");
  assertNoError(error, "Failed to delete student");
  return data && data.length ? 1 : 0;
};

module.exports = {
  findAll,
  findById,
  findByIds,
  findByEmail,
  create,
  update,
  destroy,
};
