const STORAGE_KEY = "sathee_custom_dashboards";

export const getCustomDashboards = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addCustomDashboard = ({ title, url }) => {
  const dashboards = getCustomDashboards();
  const entry = { id: `${Date.now()}`, title: title.trim(), url: url.trim() };
  const next = [...dashboards, entry];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const removeCustomDashboard = (id) => {
  const next = getCustomDashboards().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};