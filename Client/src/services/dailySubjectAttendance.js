import api from "./apiClient";

/** Fetch daily subject marks for a class slot. */
export const fetchDailySubjectAttendance = async ({
  date,
  subject,
  time = "",
  centre = "",
}) => {
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

/**
 * Batch save present/absent for one class.
 * Server upserts dailySubjectAttendances and recomputes subjectAttendances %.
 */
export const saveDailySubjectAttendance = async (payload) => {
  const response = await api.post(
    "/api/students/performance/daily-attendance",
    payload
  );
  return response.data;
};
