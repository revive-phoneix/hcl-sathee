import axios from "axios";
import { API_URL } from "../config/api";

const ANNOUNCEMENTS_API_URL = `${API_URL}/api/announcements`;

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
  const response = await axios.get(ANNOUNCEMENTS_API_URL);
  return (response.data.announcements ?? []).map(normalizeAnnouncement);
};

export const createAnnouncement = async (payload) => {
  const response = await axios.post(ANNOUNCEMENTS_API_URL, payload);
  return normalizeAnnouncement(response.data.announcement);
};

export const updateAnnouncement = async (id, payload) => {
  const response = await axios.put(`${ANNOUNCEMENTS_API_URL}/${id}`, payload);
  return normalizeAnnouncement(response.data.announcement);
};

export const removeAnnouncement = async (id) => {
  await axios.delete(`${ANNOUNCEMENTS_API_URL}/${id}`);
};
