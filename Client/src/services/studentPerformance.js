import api from "./apiClient";

export const fetchStudentPerformance = async () => {
  const response = await api.get("/api/students/performance");
  return response.data.students ?? [];
};
