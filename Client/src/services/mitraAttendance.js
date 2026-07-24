import api from "./apiClient";

export const fetchMitraAttendance = async (date) => {
  const response = await api.get("/api/mitra-attendance", {
    params: { date },
  });
  return response.data.records ?? [];
};

export const uploadMitraAttendancePhoto = async ({
  userId,
  name,
  centre,
  centreId,
  date,
  type,
  file,
}) => {
  const formData = new FormData();
  formData.append("photo", file);
  formData.append("userId", String(userId));
  formData.append("name", name || "");
  formData.append("centre", centre || "");
  if (centreId) formData.append("centreId", centreId);
  formData.append("date", date);
  formData.append("type", type);

  const response = await api.post("/api/mitra-attendance/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.record;
};
