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
 * @returns {{ schedule: object|null, synced: boolean, error?: string }}
 * synced=true means data is confirmed on the server (or intentionally empty).
 */
export const loadScheduleForPortal = async (
  portalName,
  { canMigrate = true } = {}
) => {
  const local = readLocalSchedule(portalName);

  try {
    const schedule = await fetchSchedule(portalName);
    const serverRows = schedule?.rows?.length || 0;
    const localRows = local?.rows?.length || 0;

    // Prefer richer local copy left over from pre-cloud days and push it up.
    if (canMigrate && localRows > serverRows) {
      try {
        const saved = await saveSchedule(portalName, local);
        return { schedule: saved, synced: true };
      } catch (err) {
        console.warn("Schedule migrate to server failed:", err?.message || err);
        return {
          schedule: local,
          synced: false,
          error: err?.response?.data?.message || err?.message || "Sync failed",
        };
      }
    }

    if (serverRows) {
      return { schedule, synced: true };
    }

    return { schedule: schedule || null, synced: true };
  } catch (err) {
    if (local?.rows?.length) {
      console.warn(
        "Schedule fetch failed, using local cache:",
        err?.message || err
      );
      if (canMigrate) {
        try {
          const saved = await saveSchedule(portalName, local);
          return { schedule: saved, synced: true };
        } catch (saveErr) {
          return {
            schedule: local,
            synced: false,
            error:
              saveErr?.response?.data?.message ||
              saveErr?.message ||
              "Offline — showing local copy only",
          };
        }
      }
      return {
        schedule: local,
        synced: false,
        error: "Offline — showing local copy only",
      };
    }
    throw err;
  }
};
