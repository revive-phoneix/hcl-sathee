import api from "./apiClient";

export const applyLeaveRequest = async ({ fromDate, toDate, reason, name }) => {
  const response = await api.post("/api/leave-requests", {
    fromDate,
    toDate,
    reason,
    name: name || null,
  });
  return response.data.leave;
};

export const fetchMyLeaveRequests = async () => {
  const response = await api.get("/api/leave-requests/mine");
  return response.data.leaves ?? [];
};
