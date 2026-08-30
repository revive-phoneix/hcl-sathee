import api from "./apiClient";

export const fetchUsers = async () => {
  const response = await api.get("/api/users");
  return response.data.users ?? [];
};

export const fetchVishistMentors = async () => {
  const response = await api.get("/api/users/vishist");
  return response.data.mentors ?? [];
};

export const fetchCurrentUser = async () => {
  const response = await api.get("/api/users/me");
  return response.data.user;
};

export const createUser = async (payload) => {
  const response = await api.post("/api/users", payload);
  return {
    user: response.data.user,
    emailSent: Boolean(response.data.emailSent),
    emailError: response.data.emailError || null,
    passwordSetupLink: response.data.passwordSetupLink || null,
    message: response.data.message || null,
  };
};

export const resendInvite = async (id) => {
  const response = await api.post(`/api/users/${id}/resend-invite`);
  return {
    message: response.data.message || null,
    emailSent: Boolean(response.data.emailSent),
    passwordSetupLink: response.data.passwordSetupLink || null,
  };
};

export const updateUser = async (id, payload) => {
  const response = await api.patch(`/api/users/${id}`, payload);
  return response.data.user;
};

export const updateCurrentUser = async (payload) => {
  const response = await api.patch("/api/users/me", payload);
  return response.data.user;
};

export const fetchAdminUsers = async () => {
  const response = await api.get("/api/users/admins");
  return response.data.users ?? [];
};

export const removeUser = async (id) => {
  await api.delete(`/api/users/${id}`);
};
