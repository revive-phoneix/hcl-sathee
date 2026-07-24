import api from "./apiClient";
import { parseJsonField } from "../utils/studentMetrics";

const parseStudent = (student) => ({
  ...student,
  parents: parseJsonField(student.parents),
  marks: parseJsonField(student.marks),
  attendance: parseJsonField(student.attendance),
  qualifications: parseJsonField(student.qualifications),
});

export const fetchStudents = async () => {
  const response = await api.get("/api/students");
  return (response.data.students ?? []).map(parseStudent);
};

export const createStudent = async (payload) => {
  const response = await api.post("/api/students", payload);
  return parseStudent(response.data.student);
};
