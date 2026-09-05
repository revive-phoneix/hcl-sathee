import api from "./apiClient";

export const fetchCentres = async () => {
  const response = await api.get("/api/centres");
  return response.data.centres ?? [];
};

export const createCentre = async (name) => {
  const response = await api.post("/api/centres", { name });
  return response.data.centre;
};
