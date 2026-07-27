import api from "./apiClient";

export const fetchUsers = async () => {
  const response = await api.get("/api/users");
  return response.data.users ?? [];
};

export const createUser = async (payload) => {
  const response = await api.post("/api/users", payload);
  return {
    user: response.data.user,
    emailSent: Boolean(response.data.emailSent),
    emailError: response.data.emailError || null,
    message: response.data.message || null,
  };
};

export const updateUser = async (id, payload) => {
  const response = await api.patch(`/api/users/${id}`, payload);
  return response.data.user;
};

export const removeUser = async (id) => {
  await api.delete(`/api/users/${id}`);
};
