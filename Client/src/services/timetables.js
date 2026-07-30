import api from "./apiClient";
import { getCentreValueFromPortal } from "../utils/portalMapping";

const storageKey = (portalName = "") =>
  `hcl_sathee_timetable_grid_${String(portalName || "default")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;

export const readLocalTimetable = (portalName) => {
  try {
    const raw = localStorage.getItem(storageKey(portalName));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.kind === "svg" && parsed?.dataUrl) return parsed;
    if (parsed?.kind === "grid" && Array.isArray(parsed?.slots)) return parsed;
    return null;
  } catch {
    return null;
  }
};

export const clearLocalTimetable = (portalName) => {
  try {
    localStorage.removeItem(storageKey(portalName));
  } catch {
    // ignore
  }
};

const centreFromPortal = (portalName) =>
  getCentreValueFromPortal(portalName) || portalName || "";

export const fetchTimetable = async (portalName) => {
  const centre = centreFromPortal(portalName);
  const response = await api.get("/api/timetables", {
    params: { centre },
  });
  return response.data.timetable ?? null;
};

export const saveTimetable = async (portalName, payload) => {
  const centre = centreFromPortal(portalName);
  const response = await api.put("/api/timetables", {
    centre,
    kind: payload.kind,
    name: payload.name || null,
    title: payload.title || null,
    days: payload.days || null,
    slots: payload.slots || null,
    dataUrl: payload.dataUrl || null,
  });
  clearLocalTimetable(portalName);
  return response.data.timetable;
};

export const deleteTimetable = async (portalName) => {
  const centre = centreFromPortal(portalName);
  await api.delete("/api/timetables", { params: { centre } });
  clearLocalTimetable(portalName);
  return null;
};

/**
 * Load from server; one-time migrate from localStorage if server empty.
 */
export const loadTimetableForPortal = async (
  portalName,
  { canMigrate = true } = {}
) => {
  let timetable = null;
  try {
    timetable = await fetchTimetable(portalName);
  } catch (err) {
    const local = readLocalTimetable(portalName);
    if (local) return local;
    throw err;
  }

  if (timetable?.kind) return timetable;

  const local = readLocalTimetable(portalName);
  if (canMigrate && local?.kind) {
    try {
      return await saveTimetable(portalName, local);
    } catch (err) {
      console.warn("Timetable migrate to server failed:", err?.message || err);
      return local;
    }
  }

  return timetable;
};
