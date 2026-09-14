import api from "./apiClient";

export const registerDeviceToken = async (token) => {
  if (!token) return;
  await api.patch("/api/users/me/fcm-token", { token });
};

export const unregisterDeviceToken = async (token) => {
  if (!token) return;
  await api.delete("/api/users/me/fcm-token", { data: { token } });
};