import api from "./apiClient";

export const fetchDailySubjectAttendance = async ({ date, subject, time = "", centre = "" }) => {
  const response = await api.get("/api/students/performance/daily-attendance", {
    params: {
      date,
      subject,
      ...(time ? { time } : {}),
      ...(centre ? { centre } : {}),
    },
  });
  return response.data.records ?? [];
};

export const saveDailySubjectAttendance = async (payload) => {
  const response = await api.post("/api/students/performance/daily-attendance", payload);
  return response.data;
};
