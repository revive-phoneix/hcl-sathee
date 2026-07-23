import axios from "axios";
import { API_URL } from "../config/api";

const MITRA_ATTENDANCE_URL = `${API_URL}/api/mitra-attendance`;

export const fetchMitraAttendance = async (date) => {
  const response = await axios.get(MITRA_ATTENDANCE_URL, {
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

  const response = await axios.post(`${MITRA_ATTENDANCE_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.record;
};
