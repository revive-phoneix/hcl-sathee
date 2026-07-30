import api from "./apiClient";
import {
  clearLocalSchedule,
  readLocalSchedule,
  writeLocalSchedule,
} from "../Components/Schedule/scheduleData";
import { getCentreValueFromPortal } from "../utils/portalMapping";

const centreFromPortal = (portalName) =>
  getCentreValueFromPortal(portalName) || portalName || "";

const requestConfig = {
  timeout: 60000,
};

export const fetchSchedule = async (portalName) => {
  const centre = centreFromPortal(portalName);
  const response = await api.get("/api/schedules", {
    params: { centre },
    ...requestConfig,
  });
  const schedule = response.data.schedule ?? null;
  if (schedule?.rows?.length) writeLocalSchedule(portalName, schedule);
  return schedule;
};

export const saveSchedule = async (portalName, payload) => {
  const centre = centreFromPortal(portalName);
  const response = await api.put(
    "/api/schedules",
    {
      centre,
      rows: payload?.rows || [],
      name: payload?.name || null,
      lastFile: payload?.lastFile || payload?.name || null,
      monthCount: payload?.monthCount ?? null,
      rowCount: payload?.rowCount ?? (payload?.rows?.length || 0),
    },
    requestConfig
  );
  const saved = response.data.schedule ?? payload;
  writeLocalSchedule(portalName, saved);
  return saved;
};

export const deleteSchedule = async (portalName) => {
  const centre = centreFromPortal(portalName);
  await api.delete("/api/schedules", {
    params: { centre },
    ...requestConfig,
  });
  clearLocalSchedule(portalName);
  return null;
};

/**
 * Prefer server. Fall back to local cache if API fails.
 * Migrate older local-only data to server when empty (editors only).
 */
export const loadScheduleForPortal = async (portalName, { canMigrate = true } = {}) => {
  try {
    const schedule = await fetchSchedule(portalName);
    if (schedule?.rows?.length) return schedule;

    const local = readLocalSchedule(portalName);
    if (canMigrate && local?.rows?.length) {
      try {
        return await saveSchedule(portalName, local);
      } catch (err) {
        console.warn("Schedule migrate to server failed:", err?.message || err);
        return local;
      }
    }
    return schedule;
  } catch (err) {
    const local = readLocalSchedule(portalName);
    if (local?.rows?.length) {
      console.warn(
        "Schedule fetch failed, using local cache:",
        err?.message || err
      );
      return local;
    }
    throw err;
  }
};
