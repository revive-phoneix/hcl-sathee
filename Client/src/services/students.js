import api from "./apiClient";
import { parseJsonField } from "../utils/studentMetrics";

const parseSubjects = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseStudent = (student) => ({
  ...student,
  parents: parseJsonField(student.parents),
  subjects: parseSubjects(student.subjects),
  marks: parseJsonField(student.marks),
  attendance: parseJsonField(student.attendance),
  qualifications: parseJsonField(student.qualifications),
  performances: Array.isArray(student.performances) ? student.performances : [],
  attendances: Array.isArray(student.attendances) ? student.attendances : [],
});

export const fetchStudents = async () => {
  const response = await api.get("/api/students");
  return (response.data.students ?? []).map(parseStudent);
};

export const createStudent = async (payload) => {
  const response = await api.post("/api/students", payload);
  return parseStudent(response.data.student);
};
