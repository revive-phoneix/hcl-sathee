import api from "./apiClient";

export const fetchUsers = async () => {
  const response = await api.get("/api/users");
  return response.data.users ?? [];
};

export const createUser = async (payload) => {
  const response = await api.post("/api/users", payload);
  return response.data.user;
};

export const removeUser = async (id) => {
  await api.delete(`/api/users/${id}`);
};
