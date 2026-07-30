import api from "./apiClient";
import {
  clearLocalSchedule,
  readLocalSchedule,
} from "../Components/Schedule/scheduleData";
import { getCentreValueFromPortal } from "../utils/portalMapping";

const centreFromPortal = (portalName) =>
  getCentreValueFromPortal(portalName) || portalName || "";

export const fetchSchedule = async (portalName) => {
  const centre = centreFromPortal(portalName);
  const response = await api.get("/api/schedules", {
    params: { centre },
  });
  return response.data.schedule ?? null;
};

export const saveSchedule = async (portalName, payload) => {
  const centre = centreFromPortal(portalName);
  const response = await api.put("/api/schedules", {
    centre,
    rows: payload?.rows || [],
    name: payload?.name || null,
    lastFile: payload?.lastFile || payload?.name || null,
    monthCount: payload?.monthCount ?? null,
    rowCount: payload?.rowCount ?? (payload?.rows?.length || 0),
  });
  clearLocalSchedule(portalName);
  return response.data.schedule;
};

export const deleteSchedule = async (portalName) => {
  const centre = centreFromPortal(portalName);
  await api.delete("/api/schedules", { params: { centre } });
  clearLocalSchedule(portalName);
  return null;
};

/**
 * Load from server. If server empty but this browser still has localStorage
 * data (pre-sync era), migrate once so phone/laptop stay in sync after.
 */
export const loadScheduleForPortal = async (portalName, { canMigrate = true } = {}) => {
  let schedule = null;
  try {
    schedule = await fetchSchedule(portalName);
  } catch (err) {
    // Fall back to local if API unavailable
    const local = readLocalSchedule(portalName);
    if (local) return local;
    throw err;
  }

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
};
