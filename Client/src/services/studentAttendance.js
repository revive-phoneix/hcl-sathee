import api from "./apiClient";

export const fetchStudentAttendanceByDate = async (date) => {
  const response = await api.get("/api/student-attendance", {
    params: { date },
  });
  return response.data.records ?? [];
};

export const fetchStudentAttendanceRange = async (from, to) => {
  const response = await api.get("/api/student-attendance", {
    params: { from, to },
  });
  return response.data.records ?? [];
};

export const upsertStudentAttendance = async (payload) => {
  const response = await api.post("/api/student-attendance", payload);
  return response.data.record;
};
