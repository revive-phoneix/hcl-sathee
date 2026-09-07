import api from "./apiClient";

export const fetchCentres = async () => {
  const response = await api.get("/api/centres");
  return response.data.centres ?? [];
};

// Admin-only: each centre with student / Sathee Mitra / Vishist / HCL Partner counts.
export const fetchCentresOverview = async () => {
  const response = await api.get("/api/centres/overview");
  return response.data.centres ?? [];
};

export const createCentre = async (name) => {
  const response = await api.post("/api/centres", { name });
  return response.data.centre;
};

export const renameCentre = async (id, name) => {
  const response = await api.patch(`/api/centres/${id}`, { name });
  return response.data.centre;
};

export const deleteCentre = async (id) => {
  await api.delete(`/api/centres/${id}`);
};
