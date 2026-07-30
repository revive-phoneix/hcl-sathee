import api from "./apiClient";
import { getCanonicalCentreKey, getCentreValueFromPortal } from "../utils/portalMapping";

const storageKey = (portalName = "") => {
  const centre = getCentreValueFromPortal(portalName) || portalName || "default";
  const key = getCanonicalCentreKey(centre) || "DEFAULT";
  return `hcl_sathee_timetable_${key}`;
};

const legacyTimetableKeys = (portalName = "") => {
  const centreLabel = getCentreValueFromPortal(portalName) || "";
  const rawPortal = String(portalName || "");
  const candidates = [
    rawPortal,
    centreLabel,
    getCanonicalCentreKey(centreLabel || rawPortal),
  ];
  const keys = new Set([storageKey(portalName)]);
  for (const value of candidates) {
    if (!value) continue;
    const slug = String(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!slug) continue;
    keys.add(`hcl_sathee_timetable_grid_${slug}`);
    keys.add(`hcl_sathee_timetable_${slug}`);
  }
  return [...keys];
};

const parseStoredTimetable = (raw) => {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.kind === "svg" && parsed?.dataUrl) return parsed;
    if (parsed?.kind === "grid" && Array.isArray(parsed?.slots)) return parsed;
    return null;
  } catch {
    return null;
  }
};

export const readLocalTimetable = (portalName) => {
  try {
    for (const key of legacyTimetableKeys(portalName)) {
      const parsed = parseStoredTimetable(localStorage.getItem(key));
      if (parsed) return parsed;
    }

    const centreKey = getCanonicalCentreKey(
      getCentreValueFromPortal(portalName) || portalName || ""
    );
    const loose = centreKey.replace(/^HCL/, "");
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("hcl_sathee_timetable")) continue;
      if (loose && !key.toUpperCase().includes(loose)) continue;
      const parsed = parseStoredTimetable(localStorage.getItem(key));
      if (parsed) return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const writeLocalTimetable = (portalName, payload) => {
  try {
    const primary = storageKey(portalName);
    if (!payload?.kind) {
      for (const key of legacyTimetableKeys(portalName)) {
        localStorage.removeItem(key);
      }
      return;
    }
    localStorage.setItem(primary, JSON.stringify(payload));
    for (const key of legacyTimetableKeys(portalName)) {
      if (key !== primary) localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn("Unable to cache timetable locally:", err?.message || err);
  }
};

export const clearLocalTimetable = (portalName) => {
  try {
    for (const key of legacyTimetableKeys(portalName)) {
      localStorage.removeItem(key);
    }
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
 * @returns {{ timetable: object|null, synced: boolean, error?: string }}
 */
export const loadTimetableForPortal = async (
  portalName,
  { canMigrate = true } = {}
) => {
  const local = readLocalTimetable(portalName);

  try {
    const timetable = await fetchTimetable(portalName);
    const serverHas = Boolean(timetable?.kind);
    const localHas = Boolean(local?.kind);

    // Push richer/legacy local copy when server is empty.
    if (canMigrate && localHas && !serverHas) {
      try {
        const saved = await saveTimetable(portalName, local);
        return { timetable: saved, synced: true };
      } catch (err) {
        console.warn("Timetable migrate to server failed:", err?.message || err);
        return {
          timetable: local,
          synced: false,
          error: err?.response?.data?.message || err?.message || "Sync failed",
        };
      }
    }

    if (serverHas) {
      return { timetable, synced: true };
    }

    return { timetable: timetable || null, synced: true };
  } catch (err) {
    if (local?.kind) {
      console.warn(
        "Timetable fetch failed, using local cache:",
        err?.message || err
      );
      if (canMigrate) {
        try {
          const saved = await saveTimetable(portalName, local);
          return { timetable: saved, synced: true };
        } catch (saveErr) {
          return {
            timetable: local,
            synced: false,
            error:
              saveErr?.response?.data?.message ||
              saveErr?.message ||
              "Offline — showing local copy only",
          };
        }
      }
      return {
        timetable: local,
        synced: false,
        error: "Offline — showing local copy only",
      };
    }
    throw err;
  }
};
