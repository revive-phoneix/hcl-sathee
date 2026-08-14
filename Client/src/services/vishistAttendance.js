import api from "./apiClient";

export const fetchVishistAttendance = async (date, centre, status) => {
  const response = await api.get("/api/vishist-attendance", {
    params: { date, ...(centre ? { centre } : {}), ...(status ? { status } : {}) },
  });
  return response.data.records ?? [];
};

export const markVishistAttendance = async ({ vishistUserId, subject, topicTaught, date, photoFile }) => {
  const formData = new FormData();
  formData.append("vishistUserId", vishistUserId);
  formData.append("subject", subject);
  formData.append("topicTaught", topicTaught);
  formData.append("date", date);
  if (photoFile) formData.append("photo", photoFile);
  const response = await api.post("/api/vishist-attendance", formData);
  return response.data.record;
};

export const approveVishistAttendance = async (id) => {
  const response = await api.patch(`/api/vishist-attendance/${id}/approve`);
  return response.data.record;
};