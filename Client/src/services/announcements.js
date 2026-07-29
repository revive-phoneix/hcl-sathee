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

const buildAnnouncementFormData = (payload) => {
  const formData = new FormData();
  const fields = [
    "title",
    "description",
    "category",
    "priority",
    "postedBy",
    "centre",
    "attachmentName",
    "attachmentUrl",
    "attachmentType",
    "attachmentPath",
  ];

  fields.forEach((key) => {
    if (payload[key] != null && payload[key] !== "") {
      formData.append(key, payload[key]);
    }
  });

  // null = only posting centre; array = extra centres this post also covers
  if (Object.prototype.hasOwnProperty.call(payload, "otherCentres")) {
    formData.append(
      "otherCentres",
      payload.otherCentres == null ? "" : JSON.stringify(payload.otherCentres)
    );
    formData.append(
      "other-centres",
      payload.otherCentres == null ? "" : JSON.stringify(payload.otherCentres)
    );
  }

  if (payload.attachment instanceof File) {
    formData.append("attachment", payload.attachment);
  }

  return formData;
};

export const fetchAnnouncements = async () => {
  const response = await api.get("/api/announcements");
  return (response.data.announcements ?? []).map(normalizeAnnouncement);
};

export const createAnnouncement = async (payload) => {
  const response = await api.post(
    "/api/announcements",
    buildAnnouncementFormData(payload)
  );
  return normalizeAnnouncement(response.data.announcement);
};

export const updateAnnouncement = async (id, payload) => {
  // Use POST for multipart body reliability on hosted backends
  const response = await api.post(
    `/api/announcements/${id}`,
    buildAnnouncementFormData(payload)
  );
  return normalizeAnnouncement(response.data.announcement);
};

export const removeAnnouncement = async (id) => {
  await api.delete(`/api/announcements/${id}`);
};
