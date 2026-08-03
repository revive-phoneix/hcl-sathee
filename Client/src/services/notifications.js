import api from "./apiClient";

export const registerDeviceToken = async (token) => {
  if (!token) return;
  await api.patch("/api/users/me/fcm-token", { token });
};