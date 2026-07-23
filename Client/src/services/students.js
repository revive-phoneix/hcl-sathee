import axios from "axios";
import { parseJsonField } from "../utils/studentMetrics";
import { API_URL } from "../config/api";

const STUDENTS_API_URL = `${API_URL}/api/students`;

const parseStudent = (student) => ({
  ...student,
  parents: parseJsonField(student.parents),
  marks: parseJsonField(student.marks),
  attendance: parseJsonField(student.attendance),
  qualifications: parseJsonField(student.qualifications),
});

export const fetchStudents = async () => {
  const response = await axios.get(STUDENTS_API_URL);
  return (response.data.students ?? []).map(parseStudent);
};

export const createStudent = async (payload) => {
  const response = await axios.post(STUDENTS_API_URL, payload);
  return parseStudent(response.data.student);
};
