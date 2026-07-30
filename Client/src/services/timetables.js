import api from "./apiClient";
import { getCanonicalCentreKey, getCentreValueFromPortal } from "../utils/portalMapping";

const storageKey = (portalName = "") => {
  const centre = getCentreValueFromPortal(portalName) || portalName || "default";
  const key = getCanonicalCentreKey(centre) || "DEFAULT";
  return `hcl_sathee_timetable_${key}`;
};

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

export const writeLocalTimetable = (portalName, payload) => {
  try {
    if (!payload?.kind) {
      localStorage.removeItem(storageKey(portalName));
      return;
    }
    localStorage.setItem(storageKey(portalName), JSON.stringify(payload));
  } catch (err) {
    console.warn("Unable to cache timetable locally:", err?.message || err);
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

const requestConfig = {
  timeout: 60000,
};

export const fetchTimetable = async (portalName) => {
  const centre = centreFromPortal(portalName);
  const response = await api.get("/api/timetables", {
    params: { centre },
    ...requestConfig,
  });
  const timetable = response.data.timetable ?? null;
  // Keep a device cache so reopen still works if Render is cold/slow.
  if (timetable?.kind) writeLocalTimetable(portalName, timetable);
  return timetable;
};

export const saveTimetable = async (portalName, payload) => {
  const centre = centreFromPortal(portalName);
  const response = await api.put(
    "/api/timetables",
    {
      centre,
      kind: payload.kind,
      name: payload.name || null,
      title: payload.title || null,
      days: payload.days || null,
      slots: payload.slots || null,
      dataUrl: payload.dataUrl || null,
    },
    requestConfig
  );
  const saved = response.data.timetable ?? payload;
  writeLocalTimetable(portalName, saved);
  return saved;
};

export const deleteTimetable = async (portalName) => {
  const centre = centreFromPortal(portalName);
  await api.delete("/api/timetables", {
    params: { centre },
    ...requestConfig,
  });
  clearLocalTimetable(portalName);
  return null;
};

/**
 * Prefer server. On network/API failure, use local cache.
 * If server empty but this device has older local data, migrate once (editors only).
 */
export const loadTimetableForPortal = async (
  portalName,
  { canMigrate = true } = {}
) => {
  try {
    const timetable = await fetchTimetable(portalName);
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
  } catch (err) {
    const local = readLocalTimetable(portalName);
    if (local?.kind) {
      console.warn(
        "Timetable fetch failed, using local cache:",
        err?.message || err
      );
      return local;
    }
    throw err;
  }
};
