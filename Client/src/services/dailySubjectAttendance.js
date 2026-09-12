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
  if (payload?.photo) {
    const formData = new FormData();
    formData.append("photo", payload.photo);
    formData.append("date", payload.date);
    formData.append("subject", payload.subject);
    formData.append("time", payload.time || "");
    formData.append("course", payload.course || "");
    formData.append("centre", payload.centre || "");
    formData.append("topic", payload.topic || "");
    formData.append("records", JSON.stringify(payload.records || []));

    const response = await api.post(
      "/api/students/performance/daily-attendance",
      formData
    );
    return response.data;
  }

  const response = await api.post("/api/students/performance/daily-attendance", payload);
  return response.data;
};

export const fetchAttendanceSummary = async ({ period = "daily", date, centre }) => {
  const response = await api.get("/api/students/performance/attendance-summary", {
    params: { period, ...(date ? { date } : {}), ...(centre ? { centre } : {}) },
  });
  return response.data;
};

// Admin-only: raw per-student attendance rows for a date range (Kendra Report).
export const fetchAttendanceDetail = async ({ from, to, centre }) => {
  const response = await api.get("/api/students/performance/attendance-detail", {
    params: { from, to, ...(centre ? { centre } : {}) },
  });
  return response.data.records ?? [];
};
