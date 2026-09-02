const STORAGE_KEY = "sathee_custom_centres";

export const getCustomCentres = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addCustomCentre = ({ title, subtitle }) => {
  const centres = getCustomCentres();
  const entry = { id: `${Date.now()}`, title: title.trim(), subtitle: subtitle.trim() };
  const next = [...centres, entry];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const removeCustomCentre = (id) => {
  const next = getCustomCentres().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};
