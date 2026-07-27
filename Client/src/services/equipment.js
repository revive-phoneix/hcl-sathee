import api from "./apiClient";

export const fetchEquipments = async () => {
  const response = await api.get("/api/equipments");
  return response.data.equipments ?? [];
};

export const createEquipment = async (payload) => {
  const response = await api.post("/api/equipments", payload);
  return response.data.equipment;
};
