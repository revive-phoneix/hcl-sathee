import api from "./apiClient";

const formatPostedOn = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const normalizeAnnouncement = (announcement) => ({
  ...announcement,
  postedOn: formatPostedOn(announcement.created_at || announcement.postedOn),
});

export const fetchAnnouncements = async () => {
  const response = await api.get("/api/announcements");
  return (response.data.announcements ?? []).map(normalizeAnnouncement);
};

export const createAnnouncement = async (payload) => {
  const response = await api.post("/api/announcements", payload);
  return normalizeAnnouncement(response.data.announcement);
};

export const updateAnnouncement = async (id, payload) => {
  const response = await api.put(`/api/announcements/${id}`, payload);
  return normalizeAnnouncement(response.data.announcement);
};

export const removeAnnouncement = async (id) => {
  await api.delete(`/api/announcements/${id}`);
};
