import api from "./apiClient";

export const fetchSupportQueries = async () => {
  const response = await api.get("/api/support-queries");
  return response.data.queries ?? [];
};

export const replyToSupportQuery = async (id, message) => {
  const response = await api.post(`/api/support-queries/${id}/reply`, { message });
  return response.data.query;
};
