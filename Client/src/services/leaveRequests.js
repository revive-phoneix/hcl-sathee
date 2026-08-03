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

export const fetchLeaveRequests = async () => {
  const response = await api.get("/api/leave-requests");
  const leaves = response.data.leaves ?? [];

  return [...leaves].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
};

export const updateLeaveRequestStatus = async (id, status) => {
  const response = await api.patch(`/api/leave-requests/${id}/status`, {
    status,
  });
  return response.data.leave;
};

export const fetchMyLeaveRequests = async () => {
  const response = await api.get("/api/leave-requests/mine");
  return response.data.leaves ?? [];
};
