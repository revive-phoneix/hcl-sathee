import axios from "axios";
import { API_URL } from "../config/api";

const PERFORMANCE_API_URL = `${API_URL}/api/students/performance`;

export const fetchStudentPerformance = async () => {
  const response = await axios.get(PERFORMANCE_API_URL);
  return response.data.students ?? [];
};
