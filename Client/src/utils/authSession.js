import { getAuthToken, clearAuthToken } from "./authToken";

const SESSION_KEY = "hcl_sathee_session";

export const getSession = () => {
  try {
    if (!getAuthToken()) return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session !== "object") return null;
    return {
      name: session.name || "",
      role: session.role || "",
      centre: session.centre ?? null,
      portal: session.portal || "",
    };
  } catch {
    return null;
  }
};

export const setSession = (session) => {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        name: session.name || "",
        role: session.role || "",
        centre: session.centre ?? null,
        portal: session.portal || "",
      })
    );
  } catch {
    // ignore storage errors
  }
};

export const updateSession = (patch) => {
  const current = getSession() || {
    name: "",
    role: "",
    centre: null,
    portal: "",
  };
  setSession({ ...current, ...patch });
};

export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  clearAuthToken();
};
